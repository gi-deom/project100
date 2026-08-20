const CACHE_NAME = 'gidlight-shell-v1';
const APP_SHELL = ['./', './index.html', './styles.css', './main.js', './manifest.webmanifest'];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.url.includes('bing.com') || event.request.url.includes('picsum.photos')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});