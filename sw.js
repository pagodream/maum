// 마음 곳간 서비스워커
// 원칙: 항상 네트워크(최신) 우선 → 옛 캐시를 붙들지 않음. 강제 새로고침(reload) 없음.
//       네트워크가 안 될 때만 캐시로 대체(오프라인 대비).
const CACHE = "maum-v6";

self.addEventListener("install", function () {
  // 새 워커가 곧바로 대기 없이 활성화되도록
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    (async function () {
      // 예전 캐시 전부 삭제 (옛 app.js가 남아있던 원인 제거)
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    (async function () {
      try {
        // 항상 네트워크에서 먼저 가져온다 → 늘 최신
        var fresh = await fetch(req);
        try {
          var cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()); // 오프라인 대비로만 저장
        } catch (err) {}
        return fresh;
      } catch (err) {
        // 네트워크 실패 시에만 캐시 사용
        var cached = await caches.match(req);
        return cached || Response.error();
      }
    })()
  );
});
