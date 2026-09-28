import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";

// Skarbonka API. The React SPA is served as static assets by the same Worker;
// everything under /api/* reaches this app (run_worker_first in wrangler.jsonc).
const api = new Hono<{ Bindings: Env }>().get("/ping", async (c) => {
  // Prove the D1 binding end-to-end: a real query must answer.
  // (D1 blocks sqlite_version(); a bare select is the honest liveness check.)
  const db = drizzle(c.env.DB);
  const rows = await db.all<{ ok: number }>(sql`select 1 as ok`);
  const connected = rows.length === 1 && rows[0].ok === 1;

  return c.json({
    app: "Skarbonka",
    status: "ok",
    database: connected ? "connected" : "disconnected",
  });
});

const app = new Hono<{ Bindings: Env }>().route("/api", api);

export default app;
// Consumed by the SPA's typed RPC client (hc<AppType>("/api")).
export type AppType = typeof api;
