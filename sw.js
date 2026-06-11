// Offline cache for the workout tracker (stale-while-revalidate).
// Serves the cached app instantly — even with no signal — and fetches
// updates in the background so the NEXT open gets the new version.
const CACHE = "workout-shell-v1";

self.addEventListener("install", function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.add("./"); }));
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Only handle our own origin — never intercept api.github.com (sync) or CDNs.
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      const fresh = fetch(e.request).then(function(resp) {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function() { return cached; });
      return cached || fresh;
    })
  );
});
