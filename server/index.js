import 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { initDb, one, q } from './db.js';
import { seedIfEmpty } from './seed.js';
import { applySeedBatches } from './seed-batches.js';
import publicApi, { getSetting } from './public.js';
import adminApi from './admin.js';

// tiny .env loader (no dependency)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use('/api', publicApi);
app.use('/api/admin', adminApi);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Uploaded media, served from the database with long caching
app.get('/media/:id/:size.webp', async (req, res) => {
  const col = { lg: 'data_lg', md: 'data_md', sm: 'data_sm' }[req.params.size];
  if (!col) return res.status(404).end();
  const m = await one(`SELECT ${col} AS d FROM media WHERE id=$1`, [Number(req.params.id)]);
  if (!m?.d) return res.status(404).end();
  res.set('Content-Type', 'image/webp').set('Cache-Control', 'public, max-age=31536000, immutable').send(Buffer.from(m.d));
});

const BASE = () => (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const ROUTE = { category: (e) => `/materials/${e.slug}`, application: (e) => `/applications/${e.slug}` };

app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${BASE()}/sitemap.xml\n`));
app.get('/sitemap.xml', async (_req, res) => {
  const rows = await q(`SELECT id, type, slug, data, updated_at FROM entries WHERE published AND type IN ('category','application','product')`);
  const cats = Object.fromEntries(rows.filter((r) => r.type === 'category').map((r) => [r.id, r.slug]));
  const paths = ['/', '/materials', '/applications', '/about', '/contact', '/faq'];
  for (const r of rows) paths.push(r.type === 'product' ? `/materials/${cats[r.data.category_id] || 'all'}/${r.slug}` : ROUTE[r.type](r));
  const urls = paths.flatMap((p) => [p, `/el${p === '/' ? '' : p}`]);
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${BASE()}${u}</loc></url>`).join('')}</urlset>`);
});

// Static client
const dist = path.join(__dirname, '..', 'dist');
app.use('/seed', express.static(path.join(dist, 'seed'), { maxAge: '30d' }));
app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(dist, { index: false, maxAge: '1h' }));

// SPA fallback with per page SEO tags (title, description, og, canonical, JSON-LD)
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
app.get('*', async (req, res) => {
  const file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) return res.status(503).send('Client not built. Run npm run build.');
  let html = fs.readFileSync(file, 'utf8');
  try {
    const el = req.path === '/el' || req.path.startsWith('/el/');
    const p = el ? req.path.slice(3) || '/' : req.path;
    const L = el ? 'el' : 'en';
    const seo = await getSetting('seo');
    let title = seo[`title_${L}`], desc = seo[`desc_${L}`], img = '/brand/og-logo.png', ld = null;
    const parts = p.split('/').filter(Boolean);
    const typeBy = { materials: parts.length === 3 ? 'product' : 'category', applications: 'application' };
    if (parts.length >= 2 && typeBy[parts[0]]) {
      const type = typeBy[parts[0]];
      const e = await one(`SELECT e.*, m.url, m.id AS mid FROM entries e LEFT JOIN media m ON m.id = COALESCE(e.cover_id, (e.images->>0)::int) WHERE e.type=$1 AND e.slug=$2 AND e.published`, [type, parts[parts.length - 1]]);
      if (e) {
        const name = e.seo?.[`title_${L}`] || e.data[`name_${L}`] || e.data.name_en;
        title = `${name} | G. M. Andreou Marmi`;
        desc = e.seo?.[`desc_${L}`] || e.data[`tagline_${L}`] || e.data[`desc_${L}`] || desc;
        img = e.seo?.og_image || e.url || (e.mid ? `/media/${e.mid}/lg.webp` : img);
        if (type === 'product') ld = { '@context': 'https://schema.org', '@type': 'Product', name, description: e.data[`desc_${L}`], image: BASE() + img, brand: { '@type': 'Brand', name: 'Fondovalle' } };
      }
    }
    if (!ld && p === '/') {
      const site = await getSetting('site');
      ld = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: site.company, telephone: site.phone, email: site.email,
        address: { '@type': 'PostalAddress', streetAddress: 'Livadia Industrial Area, Kellia', addressLocality: 'Livadia, Larnaca', postalCode: '7060', addressCountry: 'CY' },
        sameAs: [site.instagram, site.facebook, site.linkedin].filter(Boolean) };
    }
    const canonical = `${BASE()}${req.path}`;
    html = html
      .replace(/<html lang="en">/, `<html lang="${L}">`)
      .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
      .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(BASE() + img)}" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><link rel="canonical" href="${esc(canonical)}" /><link rel="alternate" hreflang="en" href="${esc(BASE() + p)}" /><link rel="alternate" hreflang="el" href="${esc(BASE() + '/el' + (p === '/' ? '' : p))}" />${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}`);
  } catch (e) { console.error('[seo]', e.message); }
  res.set('Cache-Control', 'no-cache').send(html);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = Number(process.env.PORT || 4010);
await initDb();
await seedIfEmpty();
await applySeedBatches();
app.listen(PORT, () => console.log(`GM Andreou Marmi running on http://localhost:${PORT}`)).on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`\nPort ${PORT} is already in use (another project is probably running). Stop it, or set PORT=<other port> in .env.\n`);
  else console.error(e);
  process.exit(1);
});
