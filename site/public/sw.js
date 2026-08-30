const CACHE = "clipboard-lan-bridge-v3";
const PAGES = ["/", "/demo/", "/privacy/", "/terms/"];
const SHELL = ["/favicon.svg", "/assets/bridge-poster-768.webp", "/assets/bridge-poster-1200.webp"];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  await Promise.all(PAGES.map(async path => {
    const response = await fetch(path);
    await cache.put(path, response.clone());
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map(match => new URL(match[1], new URL(path, self.location.origin)))
      .filter(asset => asset.origin === self.location.origin && !PAGES.includes(asset.pathname))
      .map(asset => asset.pathname);
    await cache.addAll([...new Set(assets)]);
  }));
}

self.addEventListener("install", event => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request, { ignoreVary: true }).then(cached => cached || (event.request.mode === "navigate" ? caches.match("/", { ignoreVary: true }) : Response.error()))));
});
