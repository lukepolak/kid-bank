# Cloudflare Workers + static assets + D1 + Access for the whole stack

Skarbonka is a two-parent family tool with negligible traffic and a tiny database, so we run
everything on Cloudflare's free tier in a single Worker: the React 19 SPA is served from
Workers static assets (free, unlimited, CDN-cached), a Hono API answers on `/api/*` with a
typed RPC client, Drizzle ORM sits on D1 (SQLite), and Cloudflare Access (Google OAuth,
1-month sessions) gates the entire app — no in-app auth code.

## Considered options

- **Native app (Expo)** — app-store fees and review for a 2-user tool. Rejected.
- **Cloudflare Pages** — in maintenance mode; Cloudflare points new projects at Workers. Rejected.
- **Preact instead of React** — imperceptible performance gain for a precached PWA; ecosystem
  friction. Rejected in favour of maintainer comfort (React).
- **Server-rendered HTML + htmx** — smallest surface, but the view layer would likely be
  rewritten once interactivity grows. The Hono API survives either frontend, so React from
  day one costs little.
- **tRPC instead of Hono RPC** — same end-to-end types with more machinery. Rejected.

## Consequences

- Platform lock-in: D1, Access, and the Workers runtime. Mitigated by the weekly
  `wrangler d1 export` backup (plain SQL, committed to the private repo) and a Drizzle
  schema that is portable to any SQLite.
- Access identity is read from the Access JWT in request headers — `ctx.access` does not
  work for Workers with static assets (verified against Cloudflare docs).
- Free-tier limits are enforced daily (e.g. D1 100k rows written/day); a family tool stays
  orders of magnitude below them.
