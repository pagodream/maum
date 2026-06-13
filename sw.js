// 마음 곳간 서비스워커 v2 — 네트워크 우선 (새 버전 즉시 반영, 오프라인엔 캐시)
const CACHE = "maum-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting(); // 새 워커가 바로 자리를 잡게
});

self.addEventListener("activate", (e) => {
  // 옛 캐시(maum-v1 등) 정리 — 기록(localStorage)은 캐시가 아니라 안전함
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // 네트워크 우선: 항상 새 파일을 먼저 받아오고, 받아온 걸 캐시에 갱신.
  // 인터넷이 안 될 때만 캐시로 동작(오프라인 지원 유지).
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
