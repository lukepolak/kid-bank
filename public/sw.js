/*
 * Skarbonka service worker — precached app shell (SPEC issue 08).
 *
 * Shell (HTML + all hashed assets + icons): precached at activation by
 * re-reading "/" and caching every asset it references — so a single
 * online visit makes the app open offline. Data (/api/*) is online-only
 * by design; the UI shows "brak połączenia".
 */
const CACHE = "skarbonka-shell-v2";
const STATIC = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC)),
  );
  self.skipWaiting();
});

/**
 * Read the served index.html and cache it plus every same-origin asset it
 * references (hashed bundles change names every deploy — they must be
 * discovered, not hard-coded).
 */
async function precacheShell() {
  const cache = await caches.open(CACHE);
  const response = await fetch("/");
  const html = await response.text();
  await cache.put(
    "/",
    new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
  const assetUrls = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith("/api"));
  await Promise.all(
    assetUrls.map((url) =>
      fetch(url)
        .then((asset) => cache.put(url, asset))
        .catch(() => {}),
    ),
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      await precacheShell().catch(() => {});
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // API calls are always network-only (online-only by design).
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;

  // Page navigations: network first, cached shell when offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Static assets: cache-first, refreshed in the background when online.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
