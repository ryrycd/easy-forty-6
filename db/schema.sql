
-- D1 schema for Easy Forty
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings(key,value) VALUES ('last_reset', datetime('now')), ('frozen','false');

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  cap INTEGER NOT NULL DEFAULT 50,
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  assigned_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  status TEXT, -- no/unsure/yes
  payout TEXT, -- venmo/zelle
  handle TEXT, -- @handle or null
  zelle TEXT,  -- 'same' or alt
  consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned|link_sent|pending_proof|completed
  scheduled_msg_id TEXT, -- Telnyx scheduled reminder id (optional)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  link_sent_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS proofs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
