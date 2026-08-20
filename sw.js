const CACHE_NAME = 'gidlight-shell-v2';
const APP_SHELL = ['./', './index.html', './styles.css', './main.js', './manifest.webmanifest'];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.url.includes('bing.com') || event.request.url.includes('picsum.photos')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});