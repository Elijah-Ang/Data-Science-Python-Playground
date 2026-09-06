/* Build injects exact same-origin URLs and their content identity. */
const CACHE = 'dspp-app-shell-source';
const APP_SHELL = [];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_SAVED_UPDATE') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dspp-app-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request, url=new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached=await cache.match(request);
    if (cached) return cached;
    try {return await fetch(request);} catch (error) {
      if (request.mode === 'navigate') return (await cache.match('./offline.html')) || Response.error();
      return Response.error();
    }
  }));
});
