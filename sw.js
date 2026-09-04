// RAUM — Service Worker : cache navigateur pour un chargement instantané au retour.
// Stratégie : "cache d'abord" pour tout ce qui vient du même site (pages, CSS, JS, images).
// Les polices Google restent gérées par le cache HTTP normal du navigateur.

const CACHE_VERSION = 'raum-v6';
const CORE_ASSETS = [
  'index.html',
  'menu.html',
  'galerie.html',
  'ueber-uns.html',
  'kontakt.html',
  'impressum.html',
  'datenschutz.html',
  'style.css',
  'script.js',
  'assets/favicon.svg',
  'assets/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
