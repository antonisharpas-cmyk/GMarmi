// Database: SQLite in a single file, the same setup as the APEX site.
// On Render the file lives on the persistent disk: DATABASE_URL=file:/var/data/gmarmi.db
// Locally (DATABASE_URL empty) it is ./data/gmarmi.db
//
// The rest of the server writes Postgres style SQL ($1 parameters, NOW(), ::casts).
// This file translates that small subset, so the queries stay readable in one style.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let db;

// columns stored as JSON text, returned to the code as objects
const JSON_COLS = new Set(['data', 'images', 'seo', 'value']);
// columns stored as 0/1, returned to the code as true/false
const BOOL_COLS = new Set(['published', 'featured', 'active', 'is_read', 'archived']);
export const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

function dbFile() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url && !url.startsWith('file:')) {
    // A postgres:// URL here would silently create a stray file, so stop loudly instead.
    throw new Error('DATABASE_URL must be a file path like file:/var/data/gmarmi.db');
  }
  return url ? url.slice(5) : path.join(__dirname, '..', 'data', 'gmarmi.db');
}

export async function initDb() {
  const file = dbFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log(`[db] SQLite at ${file}`);
}

// $1..$n -> ? (in order of use, repeats allowed), Postgres casts and NOW() -> SQLite
function translate(text, params) {
  const out = [];
  const sql = text
    .replace(/::(int\[\]|int|text|jsonb|integer)/g, '')
    .replace(/NOW\(\)/g, NOW_SQL)
    .replace(/\$(\d+)/g, (_, n) => { out.push(params[Number(n) - 1]); return '?'; });
  return { sql, args: out.map(toSqlite) };
}
function toSqlite(v) {
  if (v === true) return 1;
  if (v === false) return 0;
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === 'object' && !Buffer.isBuffer(v)) return JSON.stringify(v);
  return v;
}
function fromSqlite(row) {
  for (const k of Object.keys(row)) {
    const v = row[k];
    if (JSON_COLS.has(k) && typeof v === 'string') { try { row[k] = JSON.parse(v); } catch { /* keep text */ } }
    else if (BOOL_COLS.has(k) && (v === 0 || v === 1)) row[k] = v === 1;
  }
  return row;
}

export async function q(text, params = []) {
  const { sql, args } = translate(text, params);
  const stmt = db.prepare(sql);
  if (stmt.reader) return stmt.all(...args).map(fromSqlite);
  stmt.run(...args);
  return [];
}
export async function one(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}
