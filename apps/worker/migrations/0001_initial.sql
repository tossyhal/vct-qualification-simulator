CREATE TABLE IF NOT EXISTS event_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  source_revision TEXT,
  fetched_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_snapshots_hash
  ON event_snapshots(event_id, content_hash);

CREATE TABLE IF NOT EXISTS simulation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  snapshot_id INTEGER NOT NULL,
  iterations INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  generated_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY(snapshot_id) REFERENCES event_snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_runs_event
  ON simulation_runs(event_id, id DESC);

CREATE TABLE IF NOT EXISTS job_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  detail TEXT
);

