const CACHE_VERSION = 'catchacaller-v1';
const CACHE_URLS = ['/dashboard', '/conversations', '/settings'];

// Install: cache essential pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Graceful failure if offline during install
        console.log('Initial cache population skipped');
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first with fallback
self.addEventListener('fetch', (event) => {
  // Skip API calls and external resources
  if (event.request.url.includes('/functions/') || event.request.url.includes('/api/')) {
    return;
  }

  // Cache API only supports GET — skip all other methods to avoid TypeError
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache valid, same-origin responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline - dashboard data unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Push notifications handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'CatchACaller';
  const options = {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192" rx="45"/><text x="96" y="110" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CA</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="48" fill="%233b82f6"/></svg>',
    body: data.body || 'You have a new lead',
    tag: 'catchacaller-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/dashboard');
      })
    );
  }
});
