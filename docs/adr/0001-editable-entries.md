# Entries are editable and soft-deletable

Kid Bank is a family tool, not an audit system: a typo (100 zł instead of 10 zł) must be fixable
with zero ceremony, or parents stop recording entries at all. We decided entries can be edited
and soft-deleted, with `created_at`/`updated_at` timestamps preserved so changes are visible.

## Considered options

- **Append-only ledger with reversal entries** — faithful history, but two entries of ceremony
  per typo. Rejected: friction kills family adoption.
- **Editable + soft-delete** — chosen.

## Consequences

- The entry history is *not* an immutable record; it can be rewritten.
- This is the hard-to-reverse choice: once entries are editable, a faithful history cannot be
  recovered later. Do not "fix" this into append-only without revisiting this decision.
