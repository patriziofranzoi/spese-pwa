// ─── Aggiornare CACHE_NAME ad ogni release ───────────────
const CACHE_NAME = "spese-pwa-v1.0.2";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./version.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting(); // ← attiva subito il nuovo SW senza aspettare
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // ← prende controllo di tutti i tab aperti
  );
});

// Network-first: prova sempre la rete, fallback cache
self.addEventListener("fetch", event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva in cache la risposta fresca
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Ricevi messaggio per skip waiting (aggiornamento immediato)
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
