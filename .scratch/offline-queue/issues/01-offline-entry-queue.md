# Offline entry queue

Status: needs-triage

## Summary

Kid Bank v1 is online-only: the PWA shell is precached (app opens instantly) but reads and
writes require network. When a Parent has no signal (e.g. at a store checkout), entries
cannot be recorded until connectivity returns.

## Proposal

Queue entries locally (IndexedDB) while offline and sync them when the connection returns.
The v1 API is designed for this seam: adding an entry is a single simple POST, so no
redesign should be needed. Watch out for: sync-state UI, conflict handling, and unreliable
background sync on iOS.

## Scope note

Deliberately deferred from v1 — see the grilling session notes. v1 ships a clear
"brak połączenia" (no connection) state instead.
