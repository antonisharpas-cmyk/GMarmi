import sharp from 'sharp';
import { one, q } from './db.js';

export const ALLOWED_IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

// Optimise to three WebP sizes and store.
export async function storeImage(buf, filename, alt = '') {
  const img = sharp(buf, { failOn: 'error' }).rotate();
  const meta = await img.metadata();
  const lg = await sharp(buf).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const md = await sharp(buf).rotate().resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const sm = await sharp(buf).rotate().resize({ width: 520, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  const w = Math.min(meta.width || 0, 2000);
  const h = meta.width ? Math.round((meta.height / meta.width) * w) : null;
  return one(
    `INSERT INTO media (filename, alt_en, alt_el, width, height, bytes, data_lg, data_md, data_sm)
     VALUES ($1,$2,$2,$3,$4,$5,$6,$7,$8) RETURNING id, filename, alt_en, alt_el, width, height, bytes, created_at`,
    [filename, alt, w, h, lg.length, lg, md, sm]
  );
}

export async function replaceImage(id, buf, filename) {
  const lg = await sharp(buf).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const md = await sharp(buf).rotate().resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const sm = await sharp(buf).rotate().resize({ width: 520, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  const meta = await sharp(lg).metadata();
  await q(`UPDATE media SET filename=$2, width=$3, height=$4, bytes=$5, data_lg=$6, data_md=$7, data_sm=$8, url=NULL, url_sm=NULL WHERE id=$1`,
    [id, filename, meta.width, meta.height, lg.length, lg, md, sm]);
}

// Public URL helpers. v= busts caches after a replace.
export function mediaUrls(m) {
  if (!m) return null;
  if (m.url) return { id: m.id, lg: m.url, md: m.url, sm: m.url_sm || m.url, alt_en: m.alt_en, alt_el: m.alt_el, w: m.width, h: m.height };
  const v = m.bytes || 0;
  return { id: m.id, lg: `/media/${m.id}/lg.webp?v=${v}`, md: `/media/${m.id}/md.webp?v=${v}`, sm: `/media/${m.id}/sm.webp?v=${v}`, alt_en: m.alt_en, alt_el: m.alt_el, w: m.width, h: m.height };
}

export async function mediaMap(ids) {
  const uniq = [...new Set(ids.filter((x) => Number.isInteger(x)))];
  if (!uniq.length) return {};
  const rows = await q(`SELECT id, url, url_sm, alt_en, alt_el, width, height, bytes FROM media WHERE id IN (SELECT value FROM json_each($1))`, [uniq]);
  return Object.fromEntries(rows.map((r) => [r.id, mediaUrls(r)]));
}
