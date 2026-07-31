import { EVENT_ID, simulateEvent } from "@vct-sim/shared";
import { fetchLiquipediaSnapshot } from "./liquipedia";
import { contentHash, latestHash, saveRun } from "./storage";

const ITERATIONS = 100_000;

export async function runDailyUpdate(db: D1Database): Promise<{
  changed: boolean;
  durationMs: number;
}> {
  const started = Date.now();
  const job = await db
    .prepare(
      "INSERT INTO job_runs (event_id, started_at, status) VALUES (?, ?, ?)"
    )
    .bind(EVENT_ID, new Date(started).toISOString(), "running")
    .run();
  try {
    const snapshot = await fetchLiquipediaSnapshot();
    const hash = await contentHash(snapshot);
    if ((await latestHash(db, snapshot.eventId)) === hash) {
      const durationMs = Date.now() - started;
      await finishJob(db, Number(job.meta.last_row_id), "unchanged", durationMs);
      return { changed: false, durationMs };
    }
    const seed = Math.floor(Date.now() / 86_400_000);
    const simulationStarted = Date.now();
    const simulation = simulateEvent(snapshot, ITERATIONS, seed);
    await saveRun(db, snapshot, hash, simulation, Date.now() - simulationStarted);
    const durationMs = Date.now() - started;
    await finishJob(db, Number(job.meta.last_row_id), "success", durationMs);
    return { changed: true, durationMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .prepare(
        "UPDATE job_runs SET status = ?, finished_at = ?, detail = ? WHERE id = ?"
      )
      .bind("failed", new Date().toISOString(), message, job.meta.last_row_id)
      .run();
    throw error;
  }
}

async function finishJob(
  db: D1Database,
  id: number,
  status: string,
  durationMs: number
): Promise<void> {
  await db
    .prepare(
      "UPDATE job_runs SET status = ?, finished_at = ?, detail = ? WHERE id = ?"
    )
    .bind(status, new Date().toISOString(), JSON.stringify({ durationMs }), id)
    .run();
}

