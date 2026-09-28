# 01 — Walking skeleton: React + Hono on one Worker

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

The deployable spine of Skarbonka: a single Cloudflare Worker serving a React 19 + TypeScript
SPA from Workers static assets, with a Hono API answering JSON under `/api/*`, a D1 database
bound via Drizzle (empty schema, migration workflow in place), and the primary test seam
operational. Visiting the deployed URL shows the app; the app fetches a value from an API
route through the typed Hono RPC client and renders it. This is the tracer bullet: one thin
path through every layer (build, deploy, serve, query, test), leaving scaffolding for the
rest of the plan. Deploy initially on the account's workers.dev URL; the family subdomain
arrives in issue 02. Requires `wrangler login` on the maintainer's machine (the only human
step).

## Acceptance criteria

- [x] `wrangler deploy` ships one Worker: static assets (the SPA) + Hono API, via the Cloudflare Vite plugin
- [x] Visiting the deployed URL renders the React app
- [x] An `/api` route returns JSON; the SPA displays its value through the typed RPC client (no hand-written types)
- [x] Drizzle is wired to the bound D1 database; an empty migration applies both locally and remotely
- [x] Vitest + the Cloudflare Vitest plugin runs a test that calls the real Worker entry against real local D1 — the primary seam from the SPEC works
- [x] No Cloudflare Pages anywhere (ADR 0002)

## Blocked by

None - can start immediately.

## Comments

- Deployed to https://skarbonka.sdfg.pl (custom domain; workers.dev disabled — one entrance). Verified live: `/` serves the SPA, `/api/ping` answers with a connected remote D1. Empty migration applied remotely.
- Implementation notes for later slices: the testing stack is `@cloudflare/vitest-plugin` (Vite plugin), not the legacy `vitest-pool-workers` config; seam tests type the Worker's `exports` via `Cloudflare.GlobalProps.mainModule`; D1 blocks `sqlite_version()`. Remember to `pnpm build` before `pnpm run deploy` (the plugin snapshots the config into dist).
- Status: done.
