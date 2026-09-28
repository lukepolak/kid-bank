# 08 — PWA shell: installable Skarbonka

Status: ready-for-human

## Parent

[Skarbonka v1 SPEC](../SPEC.md)

## What to build

Make Skarbonka feel like an app: installable on the phone home screen, opening instantly,
honest about being offline. The agent part: web manifest (name "Skarbonka", Polish, icons,
standalone display), a service worker that precaches the app shell so the app opens without
network, and an offline state — when data requests fail, a clear "brak połączenia" banner
appears and nothing pretends to work. No offline entry queue (tracked separately in
`.scratch/offline-queue`; the single-POST entry path keeps that seam open). The human
part: install Skarbonka on both parents' phones and verify it behaves like an installed
app.

## Acceptance criteria

- [ ] The app is installable on both iOS and Android: manifest valid, icons present, standalone display, home-screen label "Skarbonka"
- [ ] With no network, the app opens to the shell instantly (precached)
- [ ] With no network, data operations fail visibly: a "brak połączenia" banner shows; no silent failures or stale data presented as fresh
- [ ] With network restored, everything works again without reinstalling
- [ ] Manual verification: installed and opened on both parents' phones (human signs off)

## Blocked by

- [04 — Entries](04-entries.md)

## Comments

- Agent part done & deployed: manifest (pl, standalone, amber theme), icons
  (192/512 + apple-touch-icon, rendered from icon.svg), hand-rolled runtime-caching
  service worker (shell cached, /api/* network-only by design), SW registration,
  explicit "brak połączenia" error states on both screens. No dependency on
  Workbox/vite-plugin-pwa — the SW is ~60 readable lines.
- **Caveat documented during build**: Access protects the PWA asset paths too —
  anonymous `curl` gets 302. Logged-in browser fetches carry the session cookie,
  so install should work; if a device fails to install or opens as a browser tab,
  the fix is path-based bypass Access applications for `/manifest.webmanifest`,
  `/sw.js` and `/icons/*` (Bypass + Everyone). These assets are public-safe.
- Status: awaiting device verification on both parents' phones.
