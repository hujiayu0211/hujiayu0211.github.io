-- D1 schema for the Hello, World visitor globe.
-- Run once against your D1 database (see deployment guide).
--
-- Privacy note: this table intentionally has NO ip column.
-- Only city-level rounded coordinates and country/city names are stored.

CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  country    TEXT,
  city       TEXT,
  lat        REAL,
  lon        REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_visits_created ON visits (created_at);
CREATE INDEX IF NOT EXISTS idx_visits_loc     ON visits (lat, lon);
