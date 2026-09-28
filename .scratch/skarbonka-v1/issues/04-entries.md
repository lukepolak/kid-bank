# 04 — Entries: record money, see the balance move

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

The heart of Skarbonka: parents record movements of money and the balance follows. The
`entries` table (signed amount in grosze, optional description, created_by, created_at,
updated_at, nullable deleted_at) arrives via Drizzle migration. The Ledger grows add-entry
and list-entries. The account detail screen shows the history newest first and an entry
form: a positive amount typed the Polish way ("149,50") plus a "Dodaj / Zabierz" action
that applies the sign. Saving shows the new balance immediately. Every entry is stamped
with the acting parent's email (from issue 02's identity) and a UTC timestamp, displayed
in Europe/Warsaw. A shared pure amount-parser module converts input to grosze and is reused
by server-side validation.

## Acceptance criteria

- [ ] Adding money ("Dodaj") and removing money ("Zabierz") with an optional description works from the account detail screen; the new balance appears immediately
- [ ] Entry history lists newest first with description, amount, timestamp (Warsaw time) and the parent who made it
- [ ] Amounts are stored as signed integers in grosze; the parser accepts "149,50" → 14950, "149" → 14900, "149,5" → 14950; letters, double separators, and negative input are rejected (sign comes only from the action)
- [ ] Entries are attributed to the acting parent from day one
- [ ] The API validates and rejects garbage amounts; balance is derived from non-deleted entries only
- [ ] Integration tests at the primary seam: add entry → derived balance updates; attribution stamped; validation rejects malformed amounts
- [ ] Component tests: typing "149,50" submits 14950 grosze; the Dodaj/Zabierz toggle flips the sign; invalid input shows a Polish error message
- [ ] Amount parser has unit tests for its edge cases

## Blocked by

- [03 — Kids on the home screen](03-kids-on-home-screen.md)
