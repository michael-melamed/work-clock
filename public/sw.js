const CACHE_VERSION = 'work-clock-v1'

const STATIC_ASSETS = [
  '/',
  '/history',
  '/manifest.json',
]

const API_ROUTES = /^\/api\//

// --- Install: cache static assets ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// --- Activate: clean up old caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// --- Fetch: cache-first for static, network-first for API ---
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Network-first for API routes
  if (API_ROUTES.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache non-OK API responses
          if (!response.ok) return response
          return response
        })
        .catch(() => {
          // API is offline — return a generic error response
          return new Response(
            JSON.stringify({ data: null, error: 'Offline: No network connection' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        })
    )
    return
  }

  // Cache-first for everything else (static files, pages)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        // Only cache successful responses from our own origin
        if (
          response.ok &&
          response.type === 'basic' &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
