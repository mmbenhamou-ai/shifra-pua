const CACHE_NAME = 'shifra-pua-v2';
const OFFLINE_URL = '/offline';
const STATIC_ASSETS = [
  '/login',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Supabase API calls
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) =>
        cached ?? caches.match(OFFLINE_URL)
      )
    )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'שפרה ופועה', {
      body:  data.body ?? '',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      dir:   'rtl',
      lang:  'he',
      data:  { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
