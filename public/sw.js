const CACHE_VERSION = 'work-clock-v2'

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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

// --- Fetch: cache-first for static, network-first for API & navigations ---
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 1. Network-first for API routes
  if (API_ROUTES.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
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

  // 2. Network-first for page navigations (documents)
  // This prevents caching redirect states (like / redirecting to /login) or stale session views
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => {
        // If offline, fallback to cached pages if any exist
        return caches.match(request)
      })
    )
    return
  }

  // 3. Cache-first for other static assets (images, styles, scripts)
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

// --- Push: handle incoming push notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: '⏱️ WorkClock', body: event.data.text(), actions: [] }
  }

  const { title, body, actions = [], tag = 'work-clock-automation' } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      renotify: true,
      requireInteraction: true,
      dir: 'rtl',
      lang: 'he',
      actions,
      data: payload,
    })
  )
})

// --- Notification click: handle action buttons ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action

  const openApp = (path) =>
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.focus()
              if ('navigate' in client) client.navigate(path)
              return
            }
          }
          return self.clients.openWindow(path)
        })
    )

  if (action === 'clock-in-now') {
    event.waitUntil(
      fetch('/api/shifts/clock-in', { method: 'POST' })
        .then(() => openApp('/'))
        .catch(() => openApp('/'))
    )
  } else if (action === 'clock-out-now') {
    event.waitUntil(
      fetch('/api/shifts/clock-out', { method: 'POST' })
        .then(() => openApp('/'))
        .catch(() => openApp('/'))
    )
  } else if (action === 'remind-later' || action === 'dismiss') {
    // Just close — server handles re-scheduling
  } else {
    // Default tap — open the app
    openApp('/')
  }
})
