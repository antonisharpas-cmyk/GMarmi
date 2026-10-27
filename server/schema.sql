-- GM Andreou Marmi schema (idempotent)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- super_admin | content_manager | staff
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media library. Uploaded files are optimised to WebP in three sizes and stored in the database,
-- so the site needs no persistent disk. Seed images point to static files through url / url_sm.
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  alt_el TEXT NOT NULL DEFAULT '',
  width INT, height INT,
  bytes INT NOT NULL DEFAULT 0,
  url TEXT, url_sm TEXT,
  data_lg BYTEA, data_md BYTEA, data_sm BYTEA,
  tags TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content entries: category, brand, collection, application, product, project, faq, page
-- Bilingual fields, specifications and relations live in data (JSONB).
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb, -- ordered media ids
  cover_id INT,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, slug)
);
CREATE INDEX IF NOT EXISTS entries_type_idx ON entries (type, sort_order);

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  enquiry_type TEXT NOT NULL DEFAULT 'general',
  product_id INT,
  product_name TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment BYTEA,
  status TEXT NOT NULL DEFAULT 'new', -- new contacted in_progress quoted won lost closed
  assigned_to INT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'form', -- form | chat | product
  lang TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id SERIAL PRIMARY KEY,
  enquiry_id INT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  user_id INT,
  kind TEXT NOT NULL DEFAULT 'note', -- note | reply | status
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat. channel allows a future WhatsApp integration (channel = 'whatsapp').
CREATE TABLE IF NOT EXISTS chat_conversations (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting', -- active | waiting | closed
  unread_admin INT NOT NULL DEFAULT 0,
  page TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- visitor | admin | system
  user_id INT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
