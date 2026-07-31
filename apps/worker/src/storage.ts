import type { EventPayload, EventSnapshot, SimulationResult } from "@vct-sim/shared";

export async function contentHash(snapshot: EventSnapshot): Promise<string> {
  const stableInput = JSON.stringify({
    teams: snapshot.teams,
    matches: snapshot.matches
  });
  const bytes = new TextEncoder().encode(stableInput);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function latestHash(db: D1Database, eventId: string): Promise<string | null> {
  const row = await db
    .prepare(
      "SELECT content_hash FROM event_snapshots WHERE event_id = ? ORDER BY id DESC LIMIT 1"
    )
    .bind(eventId)
    .first<{ content_hash: string }>();
  return row?.content_hash ?? null;
}

export async function saveRun(
  db: D1Database,
  snapshot: EventSnapshot,
  hash: string,
  simulation: SimulationResult,
  durationMs: number
): Promise<void> {
  const snapshotResult = await db
    .prepare(
      `INSERT INTO event_snapshots
       (event_id, content_hash, source_revision, fetched_at, payload)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      snapshot.eventId,
      hash,
      snapshot.sourceUpdatedAt,
      snapshot.fetchedAt,
      JSON.stringify(snapshot)
    )
    .run();
  await db
    .prepare(
      `INSERT INTO simulation_runs
       (event_id, snapshot_id, iterations, seed, generated_at, duration_ms, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      snapshot.eventId,
      snapshotResult.meta.last_row_id,
      simulation.iterations,
      simulation.seed,
      simulation.generatedAt,
      durationMs,
      JSON.stringify(simulation)
    )
    .run();
}

export async function latestPayload(
  db: D1Database,
  eventId: string
): Promise<EventPayload | null> {
  const row = await db
    .prepare(
      `SELECT s.payload AS snapshot, r.payload AS simulation
       FROM simulation_runs r
       JOIN event_snapshots s ON s.id = r.snapshot_id
       WHERE r.event_id = ?
       ORDER BY r.id DESC
       LIMIT 1`
    )
    .bind(eventId)
    .first<{ snapshot: string; simulation: string }>();
  if (!row) return null;
  return {
    ...(JSON.parse(row.snapshot) as EventSnapshot),
    simulation: JSON.parse(row.simulation) as SimulationResult
  };
}

