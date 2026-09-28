# 07 — Kid management: rename & archive

Status: ready-for-agent

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Complete kid lifecycle management in the Ledger and UI. Renaming a kid updates the name
everywhere. Archiving a kid hides their account from the home screen but preserves the
account and its entire entry history — kids are never deleted (per SPEC). Unarchiving
restores the account to the home screen, so archiving is never a trap. The kid-management
UI (add exists since issue 03) gains rename and archive/unarchive.

## Acceptance criteria

- [x] A kid can be renamed; the new name appears everywhere immediately
- [x] A kid can be archived; their account disappears from the home screen
- [x] An archived kid's entries and history are fully preserved and their balance still derives correctly
- [x] An archived kid can be unarchived, returning them to the home screen
- [x] There is no way to delete a kid anywhere in the API or UI
- [x] Integration tests at the primary seam: rename; archive → absent from accounts list; unarchive → present again; entries untouched throughout

## Blocked by

- [03 — Kids on the home screen](03-kids-on-home-screen.md)

## Comments

- Status: done. PATCH /api/kids/:id handles rename and archive/unarchive in one
  endpoint (at least one field required). The accounts list still carries archived
  kids (flagged) so they can be restored; the home screen filters them into a
  "Zarchiwizowane" section with Przywróć. Deleting a kid is impossible — DELETE has
  no route, pinned by test. Deployed.
