// Database adapter.
// Production: PostgreSQL via DATABASE_URL (Render Postgres).
// Local development: if DATABASE_URL is empty, an embedded Postgres (PGlite) is stored in ./data/pg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let impl;

export async function initDb() {
  if (process.env.DATABASE_URL) {
    const pg = (await import('pg')).default;
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
    });
    impl = { query: (text, params) => pool.query(text, params), exec: (sql) => pool.query(sql) };
    console.log('[db] PostgreSQL connected');
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const dir = path.join(__dirname, '..', 'data', 'pg');
    fs.mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    await db.waitReady;
    impl = { query: (text, params) => db.query(text, params), exec: (sql) => db.exec(sql) };
    console.log('[db] Embedded PGlite at ./data/pg (development)');
  }
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await impl.exec(schema);
}

export async function q(text, params = []) {
  const r = await impl.query(text, params);
  return r.rows;
}
export async function one(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}
