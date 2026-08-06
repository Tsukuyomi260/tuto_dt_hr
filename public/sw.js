/*
 * Service worker minimal et volontairement prudent.
 *
 * Il ne précache rien : les fichiers Next.js sont hachés au build, et un
 * précache mal tenu sert des versions périmées. Il fait deux choses utiles :
 *   - cache-first sur les assets immuables /_next/static (gain net sur données comptées) ;
 *   - network-first sur les navigations, avec repli sur le cache hors ligne.
 * Les appels /api ne sont jamais mis en cache.
 */
const CACHE = "tuto-dt-hr-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            const copie = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copie = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit ?? caches.match("/"))),
    );
  }
});
