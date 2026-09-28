import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { zValidator } from "@hono/zod-validator";
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

const EntryInput = z.object({
  amountGrosze: z
    .number()
    .int()
    .refine((v) => v !== 0, "Kwota nie może być zerowa")
    .refine((v) => Math.abs(v) <= 1_000_000, "Kwota poza zakresem"),
  description: z.string().trim().max(200).nullable().optional(),
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
  .post(
    "/kids",
    zValidator("json", KidInput, (result, c) => {
      if (!result.success) {
        return c.json({ error: "Podaj imię dziecka (1–50 znaków)" }, 400);
      }
    }),
    async (c) => {
      const ledger = createLedger(c.env.DB);
      const kid = await ledger.addKid(c.req.valid("json").name);
      return c.json(kid, 201);
    },
  )
  .get("/accounts", async (c) => {
    const ledger = createLedger(c.env.DB);
    return c.json(await ledger.listAccounts());
  })
  .post(
    "/accounts/:kidId/entries",
    zValidator("json", EntryInput, (result, c) => {
      if (!result.success) {
        return c.json({ error: "Nieprawidłowa kwota lub opis" }, 400);
      }
    }),
    async (c) => {
      const ledger = createLedger(c.env.DB);
      const result = await ledger.addEntry(
        c.req.param("kidId"),
        c.req.valid("json"),
        c.get("parentEmail"),
      );
      if (!result) return c.json({ error: "Nie ma takiego dziecka" }, 404);
      return c.json(result, 201);
    },
  )
  .get("/accounts/:kidId/entries", async (c) => {
    const ledger = createLedger(c.env.DB);
    const history = await ledger.listEntries(c.req.param("kidId"));
    if (!history) return c.json({ error: "Nie ma takiego dziecka" }, 404);
    return c.json(history);
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
