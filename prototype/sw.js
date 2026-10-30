/* 공개 화면 파일만 명시적 저장 · 운영 URL/API 응답은 캐시하지 않음 */
var CACHE = 'roamly-offline-v3';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k.indexOf('roamly-offline-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  var root = new URL('.', self.location.href), relative = url.pathname.slice(root.pathname.length);
  var allowed = url.pathname.indexOf(root.pathname) === 0 && (relative === '' || relative === 'index.html' || /^assets\/(?:[a-z-]+\.(?:js|css|svg)|images\/[a-z0-9-]+\.webp)$/.test(relative));
  if (!allowed) return;
  e.respondWith(fetch(req).catch(function () {
    return caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (response) {
        if (response) return response;
        if (req.mode === 'navigate') return cache.match(new URL('index.html', root).href).then(function (fallback) { return fallback || Response.error(); });
        return Response.error();
      });
    });
  }));
});
