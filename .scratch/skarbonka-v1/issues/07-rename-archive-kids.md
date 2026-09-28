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

- [ ] A kid can be renamed; the new name appears everywhere immediately
- [ ] A kid can be archived; their account disappears from the home screen
- [ ] An archived kid's entries and history are fully preserved and their balance still derives correctly
- [ ] An archived kid can be unarchived, returning them to the home screen
- [ ] There is no way to delete a kid anywhere in the API or UI
- [ ] Integration tests at the primary seam: rename; archive → absent from accounts list; unarchive → present again; entries untouched throughout

## Blocked by

- [03 — Kids on the home screen](03-kids-on-home-screen.md)
