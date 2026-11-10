/* sw.js — cache-first, chạy 100% offline. Đổi V khi phát hành bản mới để xóa cache cũ. */
const V = 'nhi-cb-v6';
const A = ['./', 'index.html', 'css/fonts.css', 'css/style.css', 'css/plus.css', 'js/scenes-core.js', 'js/beats-coban.js', 'js/beats-coban-2.js', 'js/quiz-data.js', 'js/crash-data.js',
  'js/cases-data.js', 'js/course.js', 'js/myths.js', 'js/lab.js', 'js/practice.js', 'js/steth.js', 'js/plus.js', 'js/app.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => Promise.all(A.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); }
    return res;
  })));
});
