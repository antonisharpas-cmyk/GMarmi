-- GM Andreou Marmi schema, SQLite (idempotent). Dates are ISO text in UTC, JSON columns are text.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- super_admin | content_manager | staff
  active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Media library. Uploaded files are optimised to WebP in three sizes and stored in the database.
-- Seed images point to static files through url / url_sm.
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  alt_el TEXT NOT NULL DEFAULT '',
  width INTEGER, height INTEGER,
  bytes INTEGER NOT NULL DEFAULT 0,
  url TEXT, url_sm TEXT,
  data_lg BLOB, data_md BLOB, data_sm BLOB,
  tags TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Content entries: category, brand, collection, application, product, project, faq
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL DEFAULT '{}',
  images TEXT NOT NULL DEFAULT '[]', -- ordered media ids
  cover_id INTEGER,
  seo TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (type, slug)
);
CREATE INDEX IF NOT EXISTS entries_type_idx ON entries (type, sort_order);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  enquiry_type TEXT NOT NULL DEFAULT 'general',
  product_id INTEGER,
  product_name TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment BLOB,
  status TEXT NOT NULL DEFAULT 'new', -- new contacted in_progress quoted won lost closed
  assigned_to INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'form', -- form | chat | product
  lang TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'note', -- note | reply | status
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Chat. channel allows a future WhatsApp integration (channel = 'whatsapp').
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting', -- active | waiting | closed
  unread_admin INTEGER NOT NULL DEFAULT 0,
  page TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  last_message_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- visitor | admin | system
  user_id INTEGER,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
