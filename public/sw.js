// RUHC Health Management System - Service Worker
// Version 3 - Auto-Update & Real-Time Sync Support

const CACHE_VERSION = 'v3.0.0-' + new Date().toISOString().split('T')[0]
const CACHE_NAME = 'ruhc-hms-' + CACHE_VERSION
const OFFLINE_URL = '/offline.html'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/hms',
  '/manifest.json',
  '/runlogo.jpg',
  '/offline.html'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_NAME)
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
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((name) => name !== CACHE_NAME)
        .map((name) => {
          console.log('[SW] Deleting old cache:', name)
          return caches.delete(name)
        })
      
      return Promise.all(deletePromises)
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim()
    }).then(() => {
      // Notify all clients that a new version is active
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NEW_VERSION_ACTIVE',
            version: CACHE_VERSION,
            cacheName: CACHE_NAME
          })
        })
      })
    })
  )
})

// Fetch event handler with version-aware caching
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Chrome extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // For API requests - Network first with no caching for realtime endpoints
  if (url.pathname.startsWith('/api/')) {
    // Don't cache realtime endpoints
    if (url.pathname.includes('/realtime') || url.pathname.includes('/sse')) {
      event.respondWith(fetch(request))
      return
    }
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful non-realtime API responses
          if (response.ok && !url.pathname.includes('/realtime')) {
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

  // For other requests - Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone())
            })
          }
          return response
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body || 'New notification from Redeemer\'s University Health Centre (RUHC)',
    icon: '/runlogo.jpg',
    badge: '/runlogo.jpg',
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

// Message handler - supports various commands from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((name) => caches.delete(name))
          )
        }).then(() => {
          event.source?.postMessage({ type: 'CACHE_CLEARED' })
        })
      )
      break
      
    case 'GET_VERSION':
      event.source?.postMessage({ 
        type: 'VERSION_INFO',
        version: CACHE_VERSION,
        cacheName: CACHE_NAME
      })
      break
      
    case 'FORCE_UPDATE':
      // Clear all caches and force reload
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((name) => caches.delete(name))
          )
        }).then(() => {
          self.skipWaiting()
          event.source?.postMessage({ type: 'UPDATE_COMPLETE', shouldReload: true })
        })
      )
      break
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PERIODIC_REFRESH' })
        })
      })
    )
  }
})
