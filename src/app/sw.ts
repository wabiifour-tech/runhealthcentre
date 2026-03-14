/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'ruhc-hms-v2'
const OFFLINE_URL = '/offline.html'

// Assets to cache on install - including the main app page
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
      console.log('Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('Failed to cache some assets:', error)
        // Continue even if some assets fail
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Chrome extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // For API requests - try network first, then return cached or offline response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline use
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached API response if available
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
              console.log('Serving from cache:', request.url)
              return cachedResponse
            }
            // Not in cache - serve offline page
            console.log('Serving offline page')
            return caches.match(OFFLINE_URL) as Promise<Response>
          })
        })
    )
    return
  }

  // For other requests - Cache First, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
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
          // Return a simple offline response
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
        if (client.url === event.notification.data.url && 'focus' in client) {
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

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Notify all clients to sync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_REQUIRED' })
        })
      })
    )
  }
})

// Message handler for manual sync trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

export {}
