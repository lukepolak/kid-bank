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

- [ ] `wrangler deploy` ships one Worker: static assets (the SPA) + Hono API, via the Cloudflare Vite plugin
- [ ] Visiting the deployed URL renders the React app
- [ ] An `/api` route returns JSON; the SPA displays its value through the typed RPC client (no hand-written types)
- [ ] Drizzle is wired to the bound D1 database; an empty migration applies both locally and remotely
- [ ] Vitest + `@cloudflare/vitest-pool-workers` runs a test that calls the real Worker entry against real local D1 — the primary seam from the SPEC works
- [ ] No Cloudflare Pages anywhere (ADR 0002)

## Blocked by

None - can start immediately.
