// Service Worker to prevent pull-to-refresh and control app behavior
const CACHE_NAME = 'balanze-v1';

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event - intercept navigation requests to prevent default refresh
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // For navigation requests (page loads), prevent default browser behavior
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If offline, return cached page or error page
          return caches.match('/index.html');
        })
    );
  }
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
