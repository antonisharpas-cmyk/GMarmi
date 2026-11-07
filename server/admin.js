import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { q, one } from './db.js';
import { requireAuth, can, signIn, signOut, PERMS } from './auth.js';
import { storeImage, replaceImage, mediaUrls, ALLOWED_IMG } from './media.js';
import { hydrate } from './public.js';
import { sendMail } from './mail.js';

const r = express.Router();
const TYPES = ['category', 'brand', 'application', 'product', 'faq'];
const imgUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 30 },
  fileFilter: (_req, f, cb) => cb(ALLOWED_IMG.includes(f.mimetype) ? null : new Error('Only JPG, PNG, WebP, AVIF or GIF images'), true),
});
const withUpload = (mw) => (req, res, next) => mw(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next()));
const log = (req, action, detail = '') => q(`INSERT INTO activity (user_id, action, detail) VALUES ($1,$2,$3)`, [req.user?.id || null, action, String(detail).slice(0, 300)]);
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';

// ---------- Auth ----------
r.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const u = await one('SELECT * FROM users WHERE email=$1 AND active', [email.toLowerCase().trim()]);
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return res.status(401).json({ error: 'Incorrect email or password' });
  await q('UPDATE users SET last_login=NOW() WHERE id=$1', [u.id]);
  signIn(res, u);
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role, perms: PERMS[u.role] });
});
r.post('/logout', (_req, res) => { signOut(res); res.json({ ok: true }); });

r.use(requireAuth);
r.get('/me', (req, res) => res.json({ ...req.user, perms: PERMS[req.user.role] }));
r.put('/me/password', async (req, res) => {
  const { current, next } = req.body || {};
  const u = await one('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(current || '', u.password_hash))) return res.status(400).json({ error: 'Current password is wrong' });
  if (!next || next.length < 10) return res.status(400).json({ error: 'Use at least 10 characters' });
  await q('UPDATE users SET password_hash=$2 WHERE id=$1', [req.user.id, await bcrypt.hash(next, 11)]);
  res.json({ ok: true });
});

// ---------- Dashboard ----------
r.get('/dashboard', async (req, res) => {
  const [counts, byStatus, recent, chats, activity, events] = await Promise.all([
    q(`SELECT type, COUNT(*)::int n FROM entries GROUP BY type`),
    q(`SELECT status, COUNT(*)::int n FROM enquiries WHERE NOT archived GROUP BY status`),
    q(`SELECT id, ref, name, enquiry_type, product_name, status, is_read, created_at FROM enquiries WHERE NOT archived ORDER BY id DESC LIMIT 8`),
    one(`SELECT COUNT(*) FILTER (WHERE status<>'closed')::int open, COALESCE(SUM(unread_admin),0)::int unread FROM chat_conversations`),
    q(`SELECT a.action, a.detail, a.created_at, u.name FROM activity a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 12`),
    q(`SELECT name, COUNT(*)::int n FROM analytics_events WHERE created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days') GROUP BY name`),
  ]);
  const e = await one(`SELECT COUNT(*) FILTER (WHERE status='new')::int new, COUNT(*) FILTER (WHERE NOT is_read)::int unread FROM enquiries WHERE NOT archived`);
  res.json({ counts: Object.fromEntries(counts.map((c) => [c.type, c.n])), byStatus, recent, chats, enquiries: e, activity, events });
});

// ---------- Entries ----------
r.get('/entries/:type', can('content'), async (req, res) => {
  if (!TYPES.includes(req.params.type)) return res.status(404).end();
  res.json(await hydrate(await q(`SELECT * FROM entries WHERE type=$1 ORDER BY sort_order, id`, [req.params.type])));
});
r.get('/options', async (_req, res) => {
  // lightweight list for relation pickers
  const rows = await q(`SELECT id, type, slug, data->>'name_en' AS name, data->>'q_en' AS q FROM entries ORDER BY type, sort_order, id`);
  res.json(rows);
});
r.get('/entries/:type/:id', can('content'), async (req, res) => {
  const row = await one(`SELECT * FROM entries WHERE type=$1 AND id=$2`, [req.params.type, Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const [h] = await hydrate([row]);
  res.json({ ...row, gallery: h.gallery });
});

async function uniqueSlug(type, slug, id = 0) {
  let s = slugify(slug), n = 1;
  while (await one(`SELECT id FROM entries WHERE type=$1 AND slug=$2 AND id<>$3`, [type, s, id])) s = `${slugify(slug)}-${++n}`;
  return s;
}

r.post('/entries/:type', can('content'), async (req, res) => {
  const { type } = req.params;
  if (!TYPES.includes(type)) return res.status(404).end();
  const b = req.body || {};
  const slug = await uniqueSlug(type, b.slug || b.data?.name_en || b.data?.q_en || type);
  const max = await one(`SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM entries WHERE type=$1`, [type]);
  const images = (b.images || []).filter(Number.isInteger);
  const row = await one(`INSERT INTO entries (type, slug, sort_order, published, featured, data, images, cover_id, seo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [type, slug, max.n, b.published ?? false, !!b.featured, JSON.stringify(b.data || {}), JSON.stringify(images), b.cover_id ?? images[0] ?? null, JSON.stringify(b.seo || {})]);
  await log(req, `${type}_create`, b.data?.name_en || slug);
  res.json(row);
});

r.put('/entries/:type/:id', can('content'), async (req, res) => {
  const { type } = req.params; const id = Number(req.params.id);
  const b = req.body || {};
  const cur = await one(`SELECT * FROM entries WHERE type=$1 AND id=$2`, [type, id]);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const slug = b.slug !== undefined ? await uniqueSlug(type, b.slug || cur.slug, id) : cur.slug;
  const images = b.images !== undefined ? b.images.filter(Number.isInteger) : cur.images;
  let cover = b.cover_id !== undefined ? b.cover_id : cur.cover_id;
  if (cover && !images.includes(cover)) cover = images[0] ?? null;
  const row = await one(`UPDATE entries SET slug=$3, published=$4, featured=$5, data=$6, images=$7, cover_id=$8, seo=$9, updated_at=NOW() WHERE type=$1 AND id=$2 RETURNING *`,
    [type, id, slug, b.published ?? cur.published, b.featured ?? cur.featured, JSON.stringify(b.data ?? cur.data), JSON.stringify(images), cover, JSON.stringify(b.seo ?? cur.seo)]);
  await log(req, `${type}_update`, row.data?.name_en || row.slug);
  res.json(row);
});

r.delete('/entries/:type/:id', can('content'), async (req, res) => {
  const row = await one(`DELETE FROM entries WHERE type=$1 AND id=$2 RETURNING slug, data`, [req.params.type, Number(req.params.id)]);
  if (row) await log(req, `${req.params.type}_delete`, row.data?.name_en || row.slug);
  res.json({ ok: true });
});

r.post('/entries/:type/:id/duplicate', can('content'), async (req, res) => {
  const cur = await one(`SELECT * FROM entries WHERE type=$1 AND id=$2`, [req.params.type, Number(req.params.id)]);
  if (!cur) return res.status(404).end();
  const data = { ...cur.data, name_en: `${cur.data.name_en || ''} (copy)`, name_el: `${cur.data.name_el || ''} (αντίγραφο)` };
  const slug = await uniqueSlug(cur.type, `${cur.slug}-copy`);
  const row = await one(`INSERT INTO entries (type, slug, sort_order, published, featured, data, images, cover_id, seo) VALUES ($1,$2,$3,false,false,$4,$5,$6,$7) RETURNING *`,
    [cur.type, slug, cur.sort_order + 1, JSON.stringify(data), JSON.stringify(cur.images), cur.cover_id, JSON.stringify(cur.seo)]);
  await log(req, `${cur.type}_duplicate`, data.name_en);
  res.json(row);
});

r.post('/entries/:type/reorder', can('content'), async (req, res) => {
  const ids = (req.body?.ids || []).map(Number);
  for (let i = 0; i < ids.length; i++) await q(`UPDATE entries SET sort_order=$1 WHERE id=$2 AND type=$3`, [i + 1, ids[i], req.params.type]);
  res.json({ ok: true });
});

// ---------- Media ----------
r.get('/media', can('media'), async (req, res) => {
  const s = `%${(req.query.q || '').toString().toLowerCase()}%`;
  const rows = await q(`SELECT id, filename, alt_en, alt_el, width, height, bytes, url, url_sm, tags, created_at FROM media
    WHERE LOWER(filename) LIKE $1 OR LOWER(alt_en) LIKE $1 ORDER BY id DESC LIMIT 500`, [s]);
  const usage = await q(`SELECT id, type, slug, data->>'name_en' AS name, images, cover_id FROM entries`);
  const settings = await q(`SELECT key, value::text AS v FROM settings`);
  res.json(rows.map((m) => {
    const used = usage.filter((e) => (e.images || []).includes(m.id) || e.cover_id === m.id).map((e) => ({ type: e.type, id: e.id, name: e.name || e.slug }));
    for (const s2 of settings) if (new RegExp(`(image[^"]*"\\s*:\\s*${m.id}[,}\\]])|(images[^\\]]*[\\[,]${m.id}[,\\]])`).test(s2.v)) used.push({ type: 'settings', id: s2.key, name: s2.key });
    return { ...mediaUrls(m), filename: m.filename, bytes: m.bytes, created_at: m.created_at, tags: m.tags, used };
  }));
});
r.post('/media', can('media'), withUpload(imgUpload.array('files', 30)), async (req, res) => {
  const out = [];
  for (const f of req.files || []) {
    try { const m = await storeImage(f.buffer, f.originalname, f.originalname.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')); out.push(mediaUrls(m)); }
    catch (e) { return res.status(400).json({ error: `${f.originalname}: not a valid image` }); }
  }
  await log(req, 'media_upload', `${out.length} file(s)`);
  res.json(out);
});
r.put('/media/:id', can('media'), async (req, res) => {
  const { alt_en = '', alt_el = '' } = req.body || {};
  await q(`UPDATE media SET alt_en=$2, alt_el=$3 WHERE id=$1`, [Number(req.params.id), alt_en.slice(0, 300), alt_el.slice(0, 300)]);
  res.json({ ok: true });
});
r.post('/media/:id/replace', can('media'), withUpload(imgUpload.single('file')), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  await replaceImage(Number(req.params.id), req.file.buffer, req.file.originalname);
  const m = await one(`SELECT id, url, url_sm, alt_en, alt_el, width, height, bytes FROM media WHERE id=$1`, [Number(req.params.id)]);
  await log(req, 'media_replace', req.file.originalname);
  res.json(mediaUrls(m));
});
r.delete('/media/:id', can('media'), async (req, res) => {
  const id = Number(req.params.id);
  // remove from every entry gallery
  const rows = await q(`SELECT id, images, cover_id FROM entries WHERE EXISTS (SELECT 1 FROM json_each(entries.images) WHERE value=$1) OR cover_id=$2`, [id, id]);
  for (const e of rows) {
    const imgs = e.images.filter((x) => x !== id);
    await q(`UPDATE entries SET images=$2, cover_id=$3 WHERE id=$1`, [e.id, JSON.stringify(imgs), e.cover_id === id ? imgs[0] ?? null : e.cover_id]);
  }
  await q(`DELETE FROM media WHERE id=$1`, [id]);
  await log(req, 'media_delete', `#${id}`);
  res.json({ ok: true });
});

// ---------- Settings / website content ----------
const SETTING_KEYS = ['site', 'home', 'about', 'legal', 'seo'];
r.get('/settings/:key', async (req, res) => {
  if (!SETTING_KEYS.includes(req.params.key)) return res.status(404).end();
  const row = await one('SELECT value FROM settings WHERE key=$1', [req.params.key]);
  res.json(row?.value || {});
});
r.put('/settings/:key', can('settings'), async (req, res) => {
  if (!SETTING_KEYS.includes(req.params.key)) return res.status(404).end();
  await q(`INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`, [req.params.key, JSON.stringify(req.body || {})]);
  await log(req, 'settings_update', req.params.key);
  res.json({ ok: true });
});

// ---------- Enquiries (CRM lite) ----------
const ENQ_COLS = `e.id, e.ref, e.name, e.company, e.email, e.phone, e.enquiry_type, e.product_id, e.product_name, e.project_type, e.message,
  e.attachment_name, e.status, e.assigned_to, e.is_read, e.archived, e.source, e.lang, e.created_at, e.updated_at, u.name AS assigned_name`;
r.get('/enquiries', can('enquiries'), async (req, res) => {
  const { status = '', type = '', search = '', archived = 'false', sort = 'new' } = req.query;
  const params = [archived === 'true'];
  let w = 'e.archived = $1';
  if (status) { params.push(status); w += ` AND e.status=$${params.length}`; }
  if (type) { params.push(type); w += ` AND e.enquiry_type=$${params.length}`; }
  if (search) { params.push(`%${String(search).toLowerCase()}%`); w += ` AND (LOWER(e.name) LIKE $${params.length} OR LOWER(e.email) LIKE $${params.length} OR LOWER(e.company) LIKE $${params.length} OR LOWER(e.ref) LIKE $${params.length} OR LOWER(e.product_name) LIKE $${params.length})`; }
  const order = sort === 'old' ? 'e.id ASC' : sort === 'name' ? 'e.name ASC' : 'e.id DESC';
  res.json(await q(`SELECT ${ENQ_COLS} FROM enquiries e LEFT JOIN users u ON u.id=e.assigned_to WHERE ${w} ORDER BY ${order} LIMIT 1000`, params));
});
r.get('/enquiries/export.csv', can('enquiries'), async (_req, res) => {
  const rows = await q(`SELECT ${ENQ_COLS} FROM enquiries e LEFT JOIN users u ON u.id=e.assigned_to ORDER BY e.id DESC`);
  const cols = ['ref', 'created_at', 'name', 'company', 'email', 'phone', 'enquiry_type', 'product_name', 'project_type', 'status', 'assigned_name', 'message'];
  const csv = [cols.join(','), ...rows.map((r2) => cols.map((c) => `"${String(r2[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="enquiries.csv"').send('﻿' + csv);
});
r.get('/enquiries/:id', can('enquiries'), async (req, res) => {
  const id = Number(req.params.id);
  await q(`UPDATE enquiries SET is_read=TRUE WHERE id=$1`, [id]);
  const e = await one(`SELECT ${ENQ_COLS} FROM enquiries e LEFT JOIN users u ON u.id=e.assigned_to WHERE e.id=$1`, [id]);
  if (!e) return res.status(404).end();
  const notes = await q(`SELECT n.*, u.name AS user_name FROM enquiry_notes n LEFT JOIN users u ON u.id=n.user_id WHERE enquiry_id=$1 ORDER BY n.id`, [id]);
  res.json({ ...e, notes });
});
r.get('/enquiries/:id/attachment', can('enquiries'), async (req, res) => {
  const e = await one(`SELECT attachment, attachment_name, attachment_mime FROM enquiries WHERE id=$1`, [Number(req.params.id)]);
  if (!e?.attachment) return res.status(404).end();
  res.set('Content-Type', e.attachment_mime || 'application/octet-stream')
    .set('Content-Disposition', `attachment; filename="${(e.attachment_name || 'file').replace(/"/g, '')}"`).send(e.attachment);
});
r.put('/enquiries/:id', can('enquiries'), async (req, res) => {
  const id = Number(req.params.id);
  const cur = await one(`SELECT * FROM enquiries WHERE id=$1`, [id]);
  if (!cur) return res.status(404).end();
  const b = req.body || {};
  const status = b.status ?? cur.status;
  await q(`UPDATE enquiries SET status=$2, assigned_to=$3, archived=$4, is_read=$5, updated_at=NOW() WHERE id=$1`,
    [id, status, b.assigned_to !== undefined ? b.assigned_to : cur.assigned_to, b.archived ?? cur.archived, b.is_read ?? cur.is_read]);
  if (status !== cur.status) await q(`INSERT INTO enquiry_notes (enquiry_id, user_id, kind, body) VALUES ($1,$2,'status',$3)`, [id, req.user.id, `Status: ${cur.status} → ${status}`]);
  await log(req, 'enquiry_update', `${cur.ref} ${status}`);
  res.json({ ok: true });
});
r.post('/enquiries/:id/notes', can('enquiries'), async (req, res) => {
  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Empty note' });
  res.json(await one(`INSERT INTO enquiry_notes (enquiry_id, user_id, kind, body) VALUES ($1,$2,'note',$3) RETURNING *`, [Number(req.params.id), req.user.id, body]));
});
r.post('/enquiries/:id/reply', can('enquiries'), async (req, res) => {
  const id = Number(req.params.id);
  const e = await one(`SELECT * FROM enquiries WHERE id=$1`, [id]);
  const body = String(req.body?.body || '').trim();
  if (!e || !body) return res.status(400).json({ error: 'Missing reply' });
  const sent = await sendMail({ to: e.email, subject: `Re: your enquiry ${e.ref} · GM Andreou Marmi`,
    html: `<div style="font-family:Georgia,serif;white-space:pre-wrap;line-height:1.6">${body.replace(/</g, '&lt;')}</div>` });
  await q(`INSERT INTO enquiry_notes (enquiry_id, user_id, kind, body) VALUES ($1,$2,'reply',$3)`, [id, req.user.id, body]);
  if (e.status === 'new') await q(`UPDATE enquiries SET status='contacted', updated_at=NOW() WHERE id=$1`, [id]);
  res.json({ ok: true, sent });
});
r.delete('/enquiries/:id', can('users'), async (req, res) => {
  await q(`DELETE FROM enquiries WHERE id=$1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

// ---------- Chat inbox ----------
r.get('/chats', can('chat'), async (_req, res) => {
  res.json(await q(`SELECT c.*, (SELECT body FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY id DESC LIMIT 1) AS last_body
    FROM chat_conversations c ORDER BY c.last_message_at DESC LIMIT 300`));
});
r.get('/chats/:id', can('chat'), async (req, res) => {
  const id = Number(req.params.id);
  await q(`UPDATE chat_conversations SET unread_admin=0 WHERE id=$1`, [id]);
  const c = await one(`SELECT * FROM chat_conversations WHERE id=$1`, [id]);
  if (!c) return res.status(404).end();
  const messages = await q(`SELECT m.*, u.name AS user_name FROM chat_messages m LEFT JOIN users u ON u.id=m.user_id WHERE conversation_id=$1 ORDER BY m.id`, [id]);
  res.json({ ...c, messages });
});
r.post('/chats/:id/messages', can('chat'), async (req, res) => {
  const id = Number(req.params.id);
  const body = String(req.body?.body || '').trim().slice(0, 2000);
  if (!body) return res.status(400).json({ error: 'Empty' });
  const m = await one(`INSERT INTO chat_messages (conversation_id, sender, user_id, body) VALUES ($1,'admin',$2,$3) RETURNING *`, [id, req.user.id, body]);
  await q(`UPDATE chat_conversations SET status='active', last_message_at=NOW() WHERE id=$1`, [id]);
  res.json(m);
});
r.put('/chats/:id', can('chat'), async (req, res) => {
  const s = req.body?.status;
  if (!['active', 'waiting', 'closed'].includes(s)) return res.status(400).end();
  await q(`UPDATE chat_conversations SET status=$2 WHERE id=$1`, [Number(req.params.id), s]);
  res.json({ ok: true });
});
r.post('/chats/:id/convert', can('chat'), async (req, res) => {
  const c = await one(`SELECT * FROM chat_conversations WHERE id=$1`, [Number(req.params.id)]);
  const msgs = await q(`SELECT sender, body, created_at FROM chat_messages WHERE conversation_id=$1 ORDER BY id`, [c.id]);
  const transcript = msgs.map((m) => `[${new Date(m.created_at).toLocaleString('en-GB')}] ${m.sender}: ${m.body}`).join('\n');
  const ref = 'GM' + Date.now().toString(36).toUpperCase().slice(-6);
  const e = await one(`INSERT INTO enquiries (ref, name, email, phone, enquiry_type, message, source, lang) VALUES ($1,$2,$3,$4,'general',$5,'chat',$6) RETURNING id`,
    [ref, c.name || 'Chat visitor', c.email || '', c.phone || '', transcript, c.lang]);
  await log(req, 'chat_convert', ref);
  res.json({ id: e.id });
});

// ---------- Users ----------
r.get('/users', can('users'), async (_req, res) => res.json(await q(`SELECT id, email, name, role, active, last_login, created_at FROM users ORDER BY id`)));
r.get('/staff', async (_req, res) => res.json(await q(`SELECT id, name, email FROM users WHERE active ORDER BY name`)));
r.post('/users', can('users'), async (req, res) => {
  const { email, name = '', role = 'staff', password } = req.body || {};
  if (!email || !password || password.length < 10) return res.status(400).json({ error: 'Email and a password of at least 10 characters are required' });
  if (!PERMS[role]) return res.status(400).json({ error: 'Invalid role' });
  try {
    const u = await one(`INSERT INTO users (email, name, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, active`, [email.toLowerCase().trim(), name, role, await bcrypt.hash(password, 11)]);
    await log(req, 'user_create', email);
    res.json(u);
  } catch { res.status(400).json({ error: 'That email already exists' }); }
});
r.put('/users/:id', can('users'), async (req, res) => {
  const id = Number(req.params.id);
  const { name, role, active, password } = req.body || {};
  if (role && !PERMS[role]) return res.status(400).json({ error: 'Invalid role' });
  if (id === req.user.id && (active === false || (role && role !== 'super_admin'))) return res.status(400).json({ error: 'You cannot demote or deactivate yourself' });
  const cur = await one(`SELECT * FROM users WHERE id=$1`, [id]);
  await q(`UPDATE users SET name=$2, role=$3, active=$4 WHERE id=$1`, [id, name ?? cur.name, role ?? cur.role, active ?? cur.active]);
  if (password) {
    if (password.length < 10) return res.status(400).json({ error: 'Use at least 10 characters' });
    await q(`UPDATE users SET password_hash=$2 WHERE id=$1`, [id, await bcrypt.hash(password, 11)]);
  }
  res.json({ ok: true });
});
r.delete('/users/:id', can('users'), async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot delete yourself' });
  await q(`DELETE FROM users WHERE id=$1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

export default r;
