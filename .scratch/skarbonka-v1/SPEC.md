# Skarbonka v1

Status: ready-for-agent

## Problem Statement

We track our two kids' pocket money and savings in our heads (or scattered notes). When a
kid asks "how much do I have?", we can't answer with confidence; when money moves — a
birthday gift, a LEGO purchase — nobody records it, so balances drift and history is lost.
Existing apps are ad-loaded, over-featured, or store our family's financial data behind
accounts we don't control.

## Solution

**Skarbonka**: a private, installable web app (PWA) for our family. Two parents sign in with
Google through Cloudflare Zero Trust; nobody else can open it. The home screen shows each
kid's account with its current balance. Tapping an account shows its full history and lets a
parent add or remove money with a short description ("Prezent urodzinowy", "Kupiłem LEGO
z karetką"). Balances are always computed from the recorded history, so they can never
disagree with it. The app is in Polish, opens instantly like a native app, and costs
nothing to run.

## User Stories

1. As a Parent, I want to install Skarbonka on my phone's home screen, so that opening it takes one tap like any other app.
2. As a Parent, I want to sign in with my Google account, so that I don't need to remember another password.
3. As a Parent, I want to stay signed in for up to a month, so that I almost never see a login screen.
4. As a Parent, I want anyone who isn't us to be blocked from the app, so that our kids' financial data stays private.
5. As a Parent, I want to see every kid's account and balance on one screen, so that I see the family's money at a glance.
6. As a Parent, I want an overdrawn account to be visually obvious, so that I notice it immediately.
7. As a Parent, I want balances formatted the Polish way (123,45 zł), so that they read naturally.
8. As a Parent, I want to add a kid, so that a new family member gets an account.
9. As a Parent, I want to rename a kid, so that I can fix typos or use the name we call them.
10. As a Parent, I want to archive a kid, so that the home screen stays clean without losing history.
11. As a Parent, I want to add money to an account with a description, so that gifts and allowance are recorded.
12. As a Parent, I want to remove money from an account with a description, so that purchases are recorded.
13. As a Parent, I want to type amounts with a comma like I think them (149,50), so that entering money is frictionless.
14. As a Parent, I want the new balance shown immediately after I save an entry, so that I trust the app recorded it.
15. As a Parent, I want to see an account's full entry history, newest first, so that I can review it with my kid.
16. As a Parent, I want each entry to show when it was made (in Warsaw time) and by which of us, so that we can talk about it later.
17. As a Parent, I want to edit an entry I mistyped, so that the history stays true to reality.
18. As a Parent, I want to remove an entry entered by mistake, so that the history stays clean.
19. As a Parent, I want a soft warning when an entry sends a balance below zero, so that we notice our kid is in overdraft — but I don't want to be blocked from recording reality.
20. As a Parent, I want the entry description to be optional, so that recording money is never a chore.
21. As a Parent, I want the app to open instantly from the home screen, so that it feels native.
22. As a Parent, I want a clear "brak połączenia" message when offline, so that I'm never confused by stale data.
23. As a Parent, I want the whole interface in Polish, so that it feels like ours.
24. As the Maintainer, I want a weekly automatic SQL export of the database committed to the private repo, so that years of history survive even losing the Cloudflare account.
25. As the Maintainer, I want point-in-time restore available, so that a bad migration or accidental deletion is recoverable within 7 days.
26. As the Maintainer, I want end-to-end typed API contracts, so that frontend changes are compiler-checked against the backend.
27. As the Maintainer, I want the money logic covered by integration tests against a real database, so that I can change the app without fear.
28. As the Maintainer, I want zero marginal hosting cost, so that the app can run for a decade without a decision.

## Implementation Decisions

### Domain model (canonical terms — see CONTEXT.md)

- **Kid**: a child whose money is tracked; a named record, not a user.
- **Parent**: an adult with full access; the only user kind.
- **Account**: the record of all money belonging to one Kid. One per kid; an ordered list of Entries.
- **Entry**: a single movement of money: signed amount (integer grosze), optional description, timestamps, the parent who made it. The source of truth.
- **Balance**: always derived by summing an account's non-deleted entries; never stored.
- **Overdraft**: a negative balance; allowed by design, softly warned in the UI.

### Ledger module (the deep module)

All money behavior hides behind one module with a small interface: add entry, edit entry,
soft-delete entry, list entries for an account, list accounts with derived balances and
overdraft flags, add kid, rename kid, archive kid. Internals it owns: the Drizzle schema,
all SQL, zod validation, balance aggregation, soft-delete filtering, attribution stamping,
overdraft detection. Nothing else in the codebase writes SQL.

- Entries are editable and soft-deletable with `created_at`/`updated_at` preserved — this is
  deliberate and irreversible; see ADR 0001. Do not convert to append-only.
- Kids can be archived (hidden from the home screen) but never deleted.
- Amounts are signed integers in grosze; the UI collects a positive amount plus a
  "Dodaj / Zabierz" (add/remove) action and applies the sign client-side.

### Amount parser (shared pure module)

A pure function converting Polish-formatted input to grosze: "149,50" → 14950, "149" →
14900, "149,5" → 14950. Rejects garbage (letters, double separators, negative input — sign
comes only from the add/remove action). Shared by the entry form and server-side
validation.

### Schema

Two tables via Drizzle, migrations generated and kept in the repo:

- `kids`: id, name, archived flag, created_at.
- `entries`: id, kid reference, signed amount in grosze, nullable description, created_by
  (parent email), created_at, updated_at, nullable deleted_at (soft delete).
- Index supporting "entries for a kid, newest first". Balance is computed by SQL
  aggregation over non-deleted entries — there is no balance column anywhere.

### API contract (Hono RPC, typed client)

One Worker serves the React SPA from static assets and answers JSON under `/api/*` (worker
runs first on API routes). All routes validated by zod; the typed RPC client is generated
from the route definitions:

- List accounts: returns each kid (id, name, archived) with derived balance and overdraft flag.
- Add kid / rename kid / archive kid.
- List entries for an account: newest first, non-deleted only.
- Add entry: signed grosze amount + optional description; response includes the new
  derived balance and overdraft flag.
- Edit entry (amount, description), soft-delete entry.

### Access & identity (ADR 0002)

Cloudflare Access sits in front of the whole app on a subdomain of the family's Cloudflare
zone. Google OAuth, 1-month sessions, two allowed emails. The API reads the parent's email
from the Access JWT in request headers; requests without valid Access identity get 401.
(The `ctx.access` API is unavailable for Workers with static assets.) Local development
simulates Access identity via the Wrangler dev configuration. Every entry is stamped with
the acting parent's email from day one — backfill is impossible.

### Frontend

React 19 + TypeScript + Vite SPA, developed and deployed as one unit with the Worker via the
Cloudflare Vite plugin. TanStack Query over the typed RPC client. Three screens: Home
(accounts + balances + overdraft indication), Account detail (history + entry form +
edit/delete), Kid management (add/rename/archive). Polish labels throughout; money shown as
"123,45 zł"; timestamps stored UTC, displayed Europe/Warsaw.

### PWA

Web manifest (name "Skarbonka", Polish), icons, service worker precaching the app shell so
the app opens instantly offline. Data requires network; offline state shows a clear
"brak połączenia" banner. No offline entry queue in v1 — tracked as a future issue
(`.scratch/offline-queue`), the single-POST entry path keeps that seam open.

### Backups

D1 Time Travel (7-day point-in-time recovery, free) plus a weekly GitHub Actions job
running a database export and committing the SQL dump to the private repo.

## Testing Decisions

A good test exercises external behavior only: real requests in, observable responses out —
never Drizzle internals, never mocked queries. Greenfield: these tests become the prior art.

Two seams, one primary:

1. **Worker HTTP boundary (primary)** — tests call the real Worker entry against a real
   local D1 (migrations applied) via the Cloudflare Vitest pool. Covers: identity present →
   entry stamped, identity absent → 401; entry add/edit/soft-delete reflected in history
   and derived balance; overdraft flag when balance goes negative; validation (garbage
   amounts rejected; "149,50" stored as 14950 grosze); kid add/rename/archive with history
   preserved.
2. **Amount input component** — React Testing Library: typing "149,50" submits 14950
   grosze; the Dodaj/Zabierz toggle flips the sign; invalid input shows a message. The
   shared amount parser gets plain unit tests for its edge cases within this scope (pure
   function, no ceremony).

Not tested: PWA shell (manual install check), backup workflow (run once, read the commit).
No E2E in v1.

## Out of Scope

- Kid logins or kid-facing views (Kid is a data entity in v1)
- Goals, savings pots, categories, statistics (future)
- Weekly allowance automation/reminders (future; Workers cron triggers exist when needed)
- Offline entry queue (tracked: `.scratch/offline-queue`)
- Multi-currency; interest; recurring entries
- Push notifications
- E2E tests
- Native app

## Further Notes

- Runs entirely on Cloudflare's free tier, orders of magnitude under every limit (Workers
  100k req/day; D1 5M rows read + 100k rows written per day, now enforced daily; Zero
  Trust 50 users). Static asset requests are free and unlimited.
- ADR 0001 (editable entries) and ADR 0002 (Cloudflare stack) are binding for this spec.
- The domain glossary lives in CONTEXT.md; use its terms (Account, Entry, Balance,
  Overdraft) in code and UI consistently.
- Deployment target is a subdomain of the family's existing Cloudflare zone; Access
  application configuration is part of setup (Google IdP, 1-month session duration).
