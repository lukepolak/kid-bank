import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { createLedger } from "../db/ledger";
import { extractParentEmail } from "./identity";

type AppEnv = {
  Bindings: Env;
  Variables: { parentEmail: string };
};

const KidInput = z.object({
  name: z.string().trim().min(1).max(50),
});

// Skarbonka API. The React SPA is served as static assets by the same Worker;
// everything under /api/* reaches this app (run_worker_first in wrangler.jsonc).
const api = new Hono<AppEnv>()
  .use("*", async (c, next) => {
    const email = extractParentEmail(
      c.req.header("Cf-Access-Jwt-Assertion"),
      c.env,
    );
    if (!email) return c.text("Wymagane logowanie", 401);
    c.set("parentEmail", email);
    await next();
  })
  .post("/kids", async (c) => {
    const input = KidInput.safeParse(await c.req.json().catch(() => null));
    if (!input.success) {
      return c.json({ error: "Podaj imię dziecka (1–50 znaków)" }, 400);
    }
    const ledger = createLedger(c.env.DB);
    const kid = await ledger.addKid(input.data.name);
    return c.json(kid, 201);
  })
  .get("/accounts", async (c) => {
    const ledger = createLedger(c.env.DB);
    return c.json(await ledger.listAccounts());
  })
  .get("/ping", async (c) => {
  // Prove the D1 binding end-to-end: a real query must answer.
  // (D1 blocks sqlite_version(); a bare select is the honest liveness check.)
  const db = drizzle(c.env.DB);
  const rows = await db.all<{ ok: number }>(sql`select 1 as ok`);
  const connected = rows.length === 1 && rows[0].ok === 1;

  return c.json({
    app: "Skarbonka",
    status: "ok",
    database: connected ? "connected" : "disconnected",
    parent: c.get("parentEmail"),
  });
});

const app = new Hono<{ Bindings: Env }>().route("/api", api);

export default app;
// Consumed by the SPA's typed RPC client (hc<AppType>("/api")).
export type AppType = typeof api;
