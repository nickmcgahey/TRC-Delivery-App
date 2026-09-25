/* Sample PWA shell. Network only — do not cache pages, catalog, or payment steps. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* Intentionally empty: the browser continues with the network. */
});
