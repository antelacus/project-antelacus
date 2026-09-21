// This site no longer uses a service worker. Browsers that installed the old one fetch this file on
// their next visit; it takes over at once, deletes what the old worker cached, and removes itself.
// Keep it for good: a visitor may return after any length of time.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      for (const name of await caches.keys()) await caches.delete(name);
      await self.registration.unregister();
    })(),
  );
});
