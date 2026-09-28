# 03 — Kids on the home screen

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

The first real feature bullet: kids exist and appear on the home screen. This births the
Ledger module (the deep module owning the Drizzle schema, all SQL, zod validation, and
balance derivation) with a minimal surface: add kid, list accounts. The `kids` table is
created. The home screen lists each kid's account with its derived balance — zero for a
fresh account — formatted the Polish way ("0,00 zł"). A minimal add-kid control (name only)
exists in the UI. Polish labels throughout. The API returns accounts through the typed RPC
client. Balance is computed by SQL aggregation in the Ledger; no balance column exists
anywhere.

## Acceptance criteria

- [ ] A kid can be added with a name via the UI and immediately appears on the home screen
- [ ] The home screen shows each kid with their derived balance, formatted "0,00 zł" style
- [ ] The accounts API returns kid (id, name, archived) with derived balance and overdraft flag; consumed via the typed client
- [ ] The Ledger module is the only code that touches SQL; schema and queries live behind it (per SPEC)
- [ ] Drizzle migration creates the `kids` table; migration is committed to the repo
- [ ] Integration test at the primary seam: add kid via API → appears in accounts list with zero balance
- [ ] UI is Polish; domain terms match CONTEXT.md

## Blocked by

- [02 — Access lock-down](02-access-lockdown.md)
