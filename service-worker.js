const CACHE = "dspp-app-shell-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./tutorial.html",
  "./playground.html",
  "./ml.html",
  "./about.html",
  "./help.html",
  "./privacy.html",
  "./acknowledgements.html",
  "./offline.html",
  "./tutorial.css",
  "./landing.css",
  "./playground-shared.css",
  "./tutorial.js",
  "./landing.js",
  "./ml-app.js",
  "./app-platform.js",
  "./manifest.webmanifest",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/landing/data-playground-mobile-source.png",
  "./assets/landing/data-playground-desktop-source.png",
  "./assets/landing/gate-glow-mobile.png",
  "./assets/landing/gate-glow-desktop.png",
  "./assets/fonts/fonts.css",
  "./assets/fonts/jetbrains-mono-latin.woff2",
  "./assets/fonts/nunito-latin.woff2",
  "./assets/fonts/silkscreen-400-latin.woff2",
  "./assets/fonts/silkscreen-700-latin.woff2",
  "./assets/licenses/manifest.json",
  "./data/embedded-datasets.js",
  "./data/ml-embedded-datasets.js",
  "./data/seoul-bike.csv",
  "./data/candy-power-ranking.csv",
  "./data/gapminder.csv",
  "./data/wine-quality.csv",
  "./data/breast-cancer.csv",
  "./data/palmer-penguins.csv",
  "./data/car-evaluation.csv"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("./offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      });
      return cached || network;
    })
  );
});
