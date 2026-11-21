const V = 'nr-v5';
const ASET = ['./', 'index.html', 'Style.css', 'app.js', 'tema.js', 'hal2.js', 'hal3.js', 'hal4.js', 'hal5.js', 'hal6.js', 'manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(ASET.map(a => c.add(a).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const cp = res.clone();
    caches.open(V).then(c => c.put(r, cp)).catch(() => {});
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
