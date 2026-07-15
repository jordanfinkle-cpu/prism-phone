// Prism phone app — minimal shell cache. Network-first so deploys show up on
// next launch; cache fallback keeps the app opening offline. Supabase calls
// are cross-origin and never touched.
const V = 'prism-phone-v9';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) {                       // never cache an error as the offline copy
        const copy = r.clone();
        caches.open(V).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() =>
      caches.match(e.request, { ignoreSearch: true })
        .then(m => m || (e.request.mode === 'navigate'
          ? caches.match('./index.html')      // only pages fall back to the shell
          : Response.error())))
  );
});
