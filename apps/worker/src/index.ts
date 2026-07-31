import { EVENT_ID } from "@vct-sim/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { runDailyUpdate } from "./job";
import { latestPayload } from "./storage";

interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    maxAge: 86_400
  })
);

app.get("/api/health", (context) =>
  context.json({ status: "ok", eventId: EVENT_ID })
);

app.get("/api/events/:eventId", async (context) => {
  if (context.req.param("eventId") !== EVENT_ID) {
    return context.json({ error: "Event not found" }, 404);
  }
  const payload = await latestPayload(context.env.DB, EVENT_ID);
  if (!payload) return context.json({ error: "No simulation is available yet" }, 503);
  context.header("Cache-Control", "public, max-age=300, s-maxage=3600");
  return context.json(payload);
});

app.post("/internal/run", async (context) => {
  const expected = context.env.ADMIN_TOKEN;
  if (!expected || context.req.header("Authorization") !== `Bearer ${expected}`) {
    return context.json({ error: "Unauthorized" }, 401);
  }
  return context.json(await runDailyUpdate(context.env.DB));
});

export default {
  fetch: app.fetch,
  scheduled(
    _controller: ScheduledController,
    env: Env,
    context: ExecutionContext
  ): void {
    context.waitUntil(runDailyUpdate(env.DB));
  }
};

