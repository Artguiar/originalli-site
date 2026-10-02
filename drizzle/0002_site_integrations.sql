CREATE TABLE site_leads (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  profile TEXT NOT NULL,
  interest TEXT NOT NULL,
  city TEXT NOT NULL,
  page TEXT NOT NULL,
  attribution TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX site_leads_created ON site_leads(created);
CREATE TABLE site_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  lead_id TEXT NOT NULL UNIQUE REFERENCES site_leads(id),
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt TEXT NOT NULL,
  locked_until TEXT,
  last_error TEXT,
  delivered_at TEXT
);
CREATE INDEX site_outbox_pending ON site_outbox(status, next_attempt);
CREATE TABLE site_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
