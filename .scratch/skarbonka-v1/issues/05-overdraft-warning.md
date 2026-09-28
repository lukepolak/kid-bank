# 05 — Overdraft flag + soft warning

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Reality has overdrafts: a kid can spend more than they have when a parent fronts the
difference, and the app must record that truth rather than block it. The accounts API
already returns an overdraft flag (issue 03); this slice makes it real and visible.
Removing more than the balance is allowed — the balance simply goes negative — and the UI
shows a soft warning (Overdraft per CONTEXT.md): on the account detail after saving, and as
a visible indication on the home screen so an overdrawn account can be spotted at a glance.
No hard blocking anywhere.

## Acceptance criteria

- [ ] Removing more than the current balance succeeds; the balance goes negative
- [ ] The accounts API returns a correct overdraft flag (true exactly when derived balance < 0)
- [ ] The account detail screen shows a soft warning when the account is overdrawn
- [ ] The home screen makes an overdrawn account visually distinct from healthy ones
- [ ] Integration test at the primary seam: a sequence of entries crossing zero flips the overdraft flag to true; the entry itself is never rejected

## Blocked by

- [04 — Entries](04-entries.md)
