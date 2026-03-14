// RUHC Health Management System - Service Worker
// Version 2 - Full Offline Support

const CACHE_NAME = 'ruhc-hms-v2'
const OFFLINE_URL = '/offline.html'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/hms',
  '/manifest.json',
  '/logo.jpg',
  '/runlogo.jpg',
  '/offline.html'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('[SW] Failed to cache some assets:', error)
        // Try to cache what we can
        return Promise.all(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(err => console.warn('[SW] Failed to cache:', asset, err))
          )
        )
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Chrome extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // For API requests - Network first, fallback to offline response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline JSON response
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Offline - Please check your connection',
                offline: true 
              }),
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            )
          })
        })
    )
    return
  }

  // For navigation requests (HTML pages) - Network First, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', request.url)
              return cachedResponse
            }
            // Not in cache - serve offline page
            console.log('[SW] Serving offline page')
            return caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // For other requests - Cache First, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response)
                })
              }
            })
            .catch(() => {})
        )
        return cachedResponse
      }

      // Not in cache - fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return offline response
          return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable' 
          })
        })
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body || 'New notification from Redeemer\'s University Health Centre (RUHC)',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/hms'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'RUHC Notification', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // If a window is already open, focus it
      for (const client of clients) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url)
      }
    })
  )
})

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_REQUIRED' })
        })
      })
    )
  }
})

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
