# 06 — Edit & soft-delete entries

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Mistake handling, per ADR 0001: entries are editable and soft-deletable — this is a family
tool where friction kills adoption, not an audit system. The Ledger grows edit-entry
(amount, description) and soft-delete-entry. The UI: editing an entry from the history
fixes the typo and the balance follows; deleting an entry removes it from the history and
from the balance, but the row is only soft-deleted — `created_at` is preserved,
`updated_at`/`deleted_at` record that something changed. Nothing is ever physically
deleted, so the "that something changed" trail survives.

## Acceptance criteria

- [ ] An entry's amount and description can be edited from the UI; history and derived balance reflect the change
- [ ] An entry can be deleted from the UI; it disappears from history and from the balance
- [ ] Edits preserve `created_at` and update `updated_at`; deletes set `deleted_at` — no row is ever removed from the database
- [ ] Balance derivation filters out soft-deleted entries everywhere (home screen included)
- [ ] Integration tests at the primary seam: edit → balance changes; soft-delete → entry absent from list and balance, but still queryable; timestamps behave as above
- [ ] ADR 0001 is respected — do not introduce reversal entries or blocking

## Blocked by

- [04 — Entries](04-entries.md)
