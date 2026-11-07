import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { q, one } from './db.js';
import { mediaMap } from './media.js';
import { sendMail, customerConfirmation, adminNotification } from './mail.js';

const r = express.Router();
const TYPES = ['category', 'brand', 'collection', 'application', 'product', 'project', 'faq'];

export async function getSetting(key) {
  const row = await one('SELECT value FROM settings WHERE key=$1', [key]);
  return row?.value || {};
}

// Attach cover + gallery image objects to entries
export async function hydrate(rows) {
  const ids = rows.flatMap((e) => [...(e.images || []), e.cover_id]);
  const mm = await mediaMap(ids);
  return rows.map((e) => {
    const gallery = (e.images || []).map((id) => mm[id]).filter(Boolean);
    const cover = mm[e.cover_id] || gallery[0] || null;
    return { id: e.id, type: e.type, slug: e.slug, sort_order: e.sort_order, published: e.published, featured: e.featured, ...e.data, seo: e.seo, cover, gallery, updated_at: e.updated_at };
  });
}

async function listType(type, onlyPublished = true) {
  const rows = await q(`SELECT * FROM entries WHERE type=$1 ${onlyPublished ? 'AND published' : ''} ORDER BY sort_order, id`, [type]);
  return hydrate(rows);
}

// resolve every media id found in a settings object (keys ending in image / images)
async function resolveSettingImages(obj) {
  const ids = [];
  const walk = (o) => {
    for (const [k, v] of Object.entries(o || {})) {
      if (/image(_\d)?$/.test(k) && Number.isInteger(v)) ids.push(v);
      if (/images$/.test(k) && Array.isArray(v)) ids.push(...v.filter(Number.isInteger));
    }
  };
  walk(obj);
  const mm = await mediaMap(ids);
  const out = { ...obj };
  for (const [k, v] of Object.entries(obj || {})) {
    if (/image(_\d)?$/.test(k) && Number.isInteger(v)) out[k] = mm[v] || null;
    if (/images$/.test(k) && Array.isArray(v)) out[k] = v.map((id) => mm[id]).filter(Boolean);
  }
  return out;
}

r.get('/site', async (_req, res) => {
  const [site, home, about, seo, categories, collections, applications, brands] = await Promise.all([
    getSetting('site'), getSetting('home'), getSetting('about'), getSetting('seo'),
    listType('category'), listType('collection'), listType('application'), listType('brand'),
  ]);
  const homeR = await resolveSettingImages(home);
  // featured products / collection resolved
  const fp = (home.featured_products || []);
  const prods = fp.length ? await hydrate(await q(`SELECT * FROM entries WHERE id IN (SELECT value FROM json_each($1)) AND published`, [fp])) : [];
  homeR.featured_products = fp.map((id) => prods.find((p) => p.id === id)).filter(Boolean);
  homeR.featured_collection = collections.find((c) => c.id === home.featured_collection) || collections[0] || null;
  res.set('Cache-Control', 'no-cache');
  res.json({ site: await resolveSettingImages(site), home: homeR, about: await resolveSettingImages(about), seo, categories, collections, applications, brands });
});

r.get('/entries/:type', async (req, res) => {
  if (!TYPES.includes(req.params.type)) return res.status(404).json({ error: 'Unknown type' });
  res.json(await listType(req.params.type));
});

r.get('/entries/:type/:slug', async (req, res) => {
  const { type, slug } = req.params;
  if (!TYPES.includes(type)) return res.status(404).json({ error: 'Unknown type' });
  const row = await one(`SELECT * FROM entries WHERE type=$1 AND slug=$2 AND published`, [type, slug]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const [item] = await hydrate([row]);
  const products = await listType('product');
  const related = {};
  if (type === 'product') {
    const [cats, cols, brands, apps, projects] = await Promise.all([listType('category'), listType('collection'), listType('brand'), listType('application'), listType('project')]);
    related.category = cats.find((c) => c.id === item.category_id) || null;
    related.collection = cols.find((c) => c.id === item.collection_id) || null;
    related.brand = brands.find((c) => c.id === item.brand_id) || null;
    related.applications = apps.filter((a) => (item.application_ids || []).includes(a.id));
    related.projects = projects.filter((p) => (p.product_ids || []).includes(item.id));
    related.products = products.filter((p) => p.id !== item.id && (p.collection_id === item.collection_id || p.category_id === item.category_id)).slice(0, 6);
  }
  if (type === 'category') related.products = products.filter((p) => p.category_id === item.id);
  if (type === 'collection') {
    related.products = products.filter((p) => p.collection_id === item.id);
    related.brand = (await listType('brand')).find((b) => b.id === item.brand_id) || null;
    related.applications = (await listType('application')).filter((a) => (item.application_ids || []).includes(a.id));
    related.projects = (await listType('project')).filter((p) => (p.collection_ids || []).includes(item.id));
  }
  if (type === 'brand') related.products = products.filter((p) => p.brand_id === item.id);
  if (type === 'application') {
    const cats = await listType('category');
    related.categories = (item.category_ids || []).map((id) => cats.find((c) => c.id === id)).filter(Boolean);
    related.products = products.filter((p) => (item.product_ids || []).includes(p.id) || (p.application_ids || []).includes(item.id));
    related.projects = (await listType('project')).filter((p) => (p.application_ids || []).includes(item.id));
  }
  if (type === 'project') {
    related.products = products.filter((p) => (item.product_ids || []).includes(p.id));
    related.collections = (await listType('collection')).filter((c) => (item.collection_ids || []).includes(c.id));
  }
  res.json({ item, related });
});

r.get('/legal/:key', async (req, res) => {
  const legal = await getSetting('legal');
  const k = req.params.key;
  if (!['privacy', 'cookies', 'terms'].includes(k)) return res.status(404).end();
  res.json({ en: legal[`${k}_en`] || '', el: legal[`${k}_el`] || '' });
});

// ---------- Enquiries ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, f, cb) => {
    const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/acad', 'image/vnd.dwg', 'application/octet-stream'];
    cb(ok.includes(f.mimetype) && /\.(pdf|jpe?g|png|webp|docx?|dwg)$/i.test(f.originalname) ? null : new Error('File type not allowed'), true);
  },
});
const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES_ENQ = ['general', 'product', 'quote', 'project', 'showroom', 'architect', 'other'];

export async function createEnquiry(d, file) {
  const ref = 'GM' + Date.now().toString(36).toUpperCase().slice(-6);
  let productName = '';
  if (d.product_id) {
    const p = await one(`SELECT data FROM entries WHERE id=$1 AND type='product'`, [Number(d.product_id)]);
    productName = p?.data?.name_en || '';
  }
  const e = await one(
    `INSERT INTO enquiries (ref,name,company,email,phone,enquiry_type,product_id,product_name,project_type,message,attachment_name,attachment_mime,attachment,source,lang)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id, ref, name, company, email, phone, enquiry_type, product_name, project_type, message, attachment_name, lang`,
    [ref, d.name.slice(0, 200), (d.company || '').slice(0, 200), d.email.slice(0, 200), (d.phone || '').slice(0, 60),
      TYPES_ENQ.includes(d.enquiry_type) ? d.enquiry_type : 'general', d.product_id ? Number(d.product_id) : null,
      productName || (d.product_name || '').slice(0, 200), (d.project_type || '').slice(0, 120), (d.message || '').slice(0, 5000),
      file?.originalname || null, file?.mimetype || null, file?.buffer || null, d.source || 'form', d.lang === 'el' ? 'el' : 'en']
  );
  const base = process.env.PUBLIC_URL || '';
  const site = await getSetting('site');
  const notify = process.env.NOTIFY_EMAIL || site.email;
  const a = adminNotification(e, `${base}/admin/enquiries/${e.id}`);
  sendMail({ to: notify, subject: a.subject, html: a.html, replyTo: e.email,
    attachments: file ? [{ filename: file.originalname, content: file.buffer }] : undefined });
  const c = customerConfirmation(e);
  sendMail({ to: e.email, subject: c.subject, html: c.html });
  await q(`INSERT INTO activity (action, detail) VALUES ('enquiry_new', $1)`, [`${e.ref} ${e.name}`]);
  return e;
}

r.post('/enquiries', formLimiter, (req, res, next) => upload.single('file')(req, res, (err) => err ? res.status(400).json({ error: err.message }) : next()), async (req, res) => {
  const d = req.body || {};
  if (d.website) return res.json({ ok: true, ref: 'OK' }); // honeypot
  if (d.started && Date.now() - Number(d.started) < 2500) return res.json({ ok: true, ref: 'OK' }); // too fast = bot
  if (!d.name?.trim() || !EMAIL.test(d.email || '') || !d.message?.trim()) return res.status(400).json({ error: 'Please complete the required fields.' });
  if (d.consent !== 'true' && d.consent !== true) return res.status(400).json({ error: 'Consent is required.' });
  const e = await createEnquiry(d, req.file);
  res.json({ ok: true, ref: e.ref });
});

// ---------- Live chat (polling; channel column ready for WhatsApp) ----------
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 40 });
r.post('/chat/start', chatLimiter, async (req, res) => {
  const { name = '', email = '', phone = '', message = '', page = '', lang = 'en', website } = req.body || {};
  if (website) return res.json({ ok: true });
  if (!name.trim() || !message.trim() || (email && !EMAIL.test(email))) return res.status(400).json({ error: 'Name and message are required.' });
  const site = await getSetting('site');
  if (site.chat_online === false) {
    // nobody online: convert to an enquiry
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Email is required.' });
    const e = await createEnquiry({ name, email, phone, message, source: 'chat', lang, enquiry_type: 'general' });
    return res.json({ ok: true, offline: true, ref: e.ref });
  }
  const token = crypto.randomBytes(18).toString('hex');
  const c = await one(`INSERT INTO chat_conversations (token,name,email,phone,page,lang,unread_admin) VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING id`,
    [token, name.slice(0, 120), email.slice(0, 200), phone.slice(0, 60), String(page).slice(0, 200), lang === 'el' ? 'el' : 'en']);
  await q(`INSERT INTO chat_messages (conversation_id, sender, body) VALUES ($1,'visitor',$2)`, [c.id, message.slice(0, 2000)]);
  res.json({ ok: true, token });
});
r.get('/chat/:token', async (req, res) => {
  const c = await one(`SELECT id, status FROM chat_conversations WHERE token=$1`, [req.params.token]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const after = Number(req.query.after || 0);
  const msgs = await q(`SELECT id, sender, body, created_at FROM chat_messages WHERE conversation_id=$1 AND id>$2 ORDER BY id`, [c.id, after]);
  res.json({ status: c.status, messages: msgs });
});
r.post('/chat/:token', chatLimiter, async (req, res) => {
  const c = await one(`SELECT id FROM chat_conversations WHERE token=$1`, [req.params.token]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const body = String(req.body?.body || '').trim().slice(0, 2000);
  if (!body) return res.status(400).json({ error: 'Empty' });
  const m = await one(`INSERT INTO chat_messages (conversation_id, sender, body) VALUES ($1,'visitor',$2) RETURNING id, sender, body, created_at`, [c.id, body]);
  await q(`UPDATE chat_conversations SET unread_admin=unread_admin+1, last_message_at=NOW(), status=CASE WHEN status='closed' THEN 'waiting' ELSE status END WHERE id=$1`, [c.id]);
  res.json(m);
});

// ---------- Analytics (first party, privacy friendly) ----------
const EVENTS = ['page_view', 'material_view', 'product_view', 'enquiry_submit', 'quote_request', 'contact_click', 'phone_click', 'email_click', 'chat_start', 'download', 'cta_click'];
r.post('/track', rateLimit({ windowMs: 60 * 1000, limit: 120 }), async (req, res) => {
  const { name, path = '', ref = '' } = req.body || {};
  if (EVENTS.includes(name)) await q(`INSERT INTO analytics_events (name, path, ref) VALUES ($1,$2,$3)`, [name, String(path).slice(0, 200), String(ref).slice(0, 200)]);
  res.status(204).end();
});

export default r;
