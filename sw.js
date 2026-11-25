/* HK Cheap Eats service worker: works offline, always prefers fresh code when online. */
const VERSION = 'hkce-v6-1';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.json',
  'js/config.js', 'js/i18n.js', 'js/i18n-v4.js', 'js/i18n-v6.js', 'js/mtr.js', 'js/value.js', 'js/data.js', 'js/backend.js', 'js/app.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/markercluster/leaflet.markercluster.js',
  'vendor/markercluster/MarkerCluster.css', 'vendor/supabase/supabase.js', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'hkce-img').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // Map tiles and fonts: cache as you browse.
  const external = url.origin !== location.origin;
  if (external && !/arcgisonline|fonts\.(googleapis|gstatic)/.test(url.host)) return; // Supabase etc. → network only
  const isImg = /\/(img|icons|og)\//.test(url.pathname) || /arcgisonline|gstatic/.test(url.host);
  if (isImg) {
    e.respondWith(caches.open('hkce-img').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; } catch { return hit || Response.error(); }
    }));
    return;
  }
  // Pages, code and data: network first, cache as fallback.
  e.respondWith(fetch(req).then(res => {
    if (res.ok && (url.origin === location.origin || /fonts/.test(url.host))) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
