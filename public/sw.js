/* Dreams Wedding — service worker mínimo: no cachea navegaciones (App Router / RSC). */
const CACHE_NAME = "dreams-wedding-assets-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCacheableAssetRequest(url) {
  if (url.origin !== self.location.origin) return false;
  const p = url.pathname;
  if (p.startsWith("/_next/static") || p.startsWith("/_next/image")) return true;
  if (p === "/manifest.json") return true;
  return /\.(?:js|css|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(p);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate") return;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!isCacheableAssetRequest(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const networkPromise = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(networkPromise);
        return cached;
      }
      const res = await networkPromise;
      return res ?? Response.error();
    })
  );
});
