const CACHE_NAME =
  "nida-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(
            APP_SHELL
          );
        })
    );

    self.skipWaiting();
  }
);

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      caches
        .keys()
        .then(keys => {

          const oldCaches =
            keys.filter(
              key =>
                key !== CACHE_NAME
            );

          return Promise.all(
            oldCaches.map(
              key =>
                caches.delete(key)
            )
          );
        })
    );

    self.clients.claim();
  }
);

self.addEventListener(
  "fetch",
  event => {

    event.respondWith(
      caches
        .match(event.request)
        .then(cachedFile => {

          if (cachedFile) {
            return cachedFile;
          }

          return fetch(
            event.request
          );
        })
    );
  }
);