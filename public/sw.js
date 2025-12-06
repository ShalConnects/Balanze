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
  const url = new URL(request.url);
  
  // Skip service worker for localhost (Capacitor apps)
  // This prevents interference with native app loading
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return; // Let the request pass through without interception
  }
  
  // For navigation requests (page loads), prevent default browser behavior
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch((error) => {
          // If fetch fails, try to return cached page
          return caches.match('/index.html')
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cache, return a proper error response
              return new Response('Page not available', {
                status: 404,
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/plain' }
              });
            })
            .catch(() => {
              // Last resort: return a minimal error response
              return new Response('Service unavailable', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
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
