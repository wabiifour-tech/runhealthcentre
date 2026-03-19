'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

// Real-time event types
export type RealtimeEvent = 
  | 'patients_updated'
  | 'users_updated'
  | 'staff_updated'
  | 'queue_updated'
  | 'consultations_updated'
  | 'vitals_updated'
  | 'prescriptions_updated'
  | 'lab_requests_updated'
  | 'lab_results_updated'
  | 'drugs_updated'
  | 'appointments_updated'
  | 'routing_updated'
  | 'notifications_updated'
  | 'payments_updated'
  | 'admissions_updated'
  | 'announcements_updated'
  | 'settings_updated'
  | 'wallet_updated'
  | 'attendance_updated'
  | 'deployment_refresh' // Special event for new deployments
  | 'heartbeat'
  | 'connected'
  | 'version_check'

interface RealtimeMessage {
  event: RealtimeEvent
  data?: any
  timestamp: number
  version?: string // For deployment version tracking
  message?: string // Connection message
  channel?: string // SSE channel name
}

interface RealtimeContextType {
  isConnected: boolean
  lastEvent: RealtimeMessage | null
  subscribe: (events: RealtimeEvent[], callback: (data: any) => void) => () => void
  broadcast: (event: RealtimeEvent, data?: any) => Promise<void>
  refreshAll: () => void
  forceRefresh: (eventType: RealtimeEvent) => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  serverVersion: string | null
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

// Global version tracking for deployment detection
const CURRENT_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || Date.now().toString()

// Store for refresh callbacks
const refreshCallbacks = new Map<RealtimeEvent, Set<() => void>>()

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting')
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | null>(null)
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    setConnectionStatus('connecting')
    
    try {
      const eventSource = new EventSource('/api/realtime?channel=main')
      eventSourceRef.current = eventSource
      
      // Set up heartbeat timeout - if no heartbeat in 30 seconds, reconnect
      const resetHeartbeatTimeout = () => {
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.log('Heartbeat timeout, reconnecting...')
          connect()
        }, 30000)
      }
      
      eventSource.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        console.log('Real-time connection established')
        resetHeartbeatTimeout()
      }
      
      eventSource.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data)
          setLastEvent(message)
          
          // Handle heartbeat
          if (message.event === 'heartbeat') {
            resetHeartbeatTimeout()
            return
          }
          
          // Handle connection confirmation
          if (message.event === 'connected') {
            console.log('SSE connected:', message.message || message.channel || 'success')
            setServerVersion(message.version || null)
            resetHeartbeatTimeout()
            return
          }
          
          // Handle deployment refresh
          if (message.event === 'deployment_refresh') {
            const newVersion = message.version || message.timestamp?.toString()
            if (newVersion && newVersion !== serverVersion) {
              console.log('New deployment detected, refreshing...')
              setServerVersion(newVersion)
              // Clear all caches and trigger full refresh
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name))
                })
              }
              // Trigger all refresh callbacks
              refreshCallbacks.forEach((callbacks) => {
                callbacks.forEach(cb => cb())
              })
            }
            return
          }
          
          // Handle version check
          if (message.event === 'version_check') {
            setServerVersion(message.version || null)
            // Only trigger refresh if versions differ significantly (not just date-based)
            if (message.version && CURRENT_VERSION && 
                message.version !== CURRENT_VERSION &&
                !message.version.includes('T') && // Not a date string
                !CURRENT_VERSION.includes('T')) {
              console.log('Version mismatch, triggering refresh...')
              // Clear caches
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name))
                })
              }
            }
            return
          }
          
          // Dispatch to subscribers
          const eventSubscribers = subscribersRef.current.get(message.event)
          if (eventSubscribers) {
            eventSubscribers.forEach(callback => {
              try {
                callback(message.data)
              } catch (error) {
                console.error('Error in subscriber callback:', error)
              }
            })
          }
          
          // Also dispatch to 'all' subscribers
          const allSubscribers = subscribersRef.current.get('*')
          if (allSubscribers) {
            allSubscribers.forEach(callback => {
              try {
                callback(message)
              } catch (error) {
                console.error('Error in all subscriber callback:', error)
              }
            })
          }
          
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
        setConnectionStatus('reconnecting')
        
        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 3000)
      }
      
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      setConnectionStatus('disconnected')
      
      // Retry connection
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 5000)
    }
  }, [serverVersion])
  
  // Subscribe to specific events
  const subscribe = useCallback((events: RealtimeEvent[], callback: (data: any) => void): (() => void) => {
    events.forEach(event => {
      if (!subscribersRef.current.has(event)) {
        subscribersRef.current.set(event, new Set())
      }
      subscribersRef.current.get(event)!.add(callback)
    })
    
    // Return unsubscribe function
    return () => {
      events.forEach(event => {
        subscribersRef.current.get(event)?.delete(callback)
      })
    }
  }, [])
  
  // Broadcast an event to all connected clients
  const broadcast = useCallback(async (event: RealtimeEvent, data?: any): Promise<void> => {
    try {
      await fetch('/api/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          channel: 'main',
          version: CURRENT_VERSION,
        }),
      })
    } catch (error) {
      console.error('Failed to broadcast event:', error)
    }
  }, [])
  
  // Refresh all data - triggers all refresh callbacks
  const refreshAll = useCallback(() => {
    console.log('Refreshing all data...')
    refreshCallbacks.forEach((callbacks) => {
      callbacks.forEach(cb => cb())
    })
  }, [])
  
  // Force refresh a specific data type
  const forceRefresh = useCallback((eventType: RealtimeEvent) => {
    const callbacks = refreshCallbacks.get(eventType)
    if (callbacks) {
      callbacks.forEach(cb => cb())
    }
    // Also broadcast to other clients
    broadcast(eventType, { forceRefresh: true })
  }, [broadcast])
  
  // Initialize connection on mount
  useEffect(() => {
    connect()
    
    // Visibility change handler - reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!isConnected || connectionStatus === 'disconnected') {
          connect()
        }
        // Always trigger a refresh when tab becomes visible
        refreshAll()
      }
    }
    
    // Online/offline handlers
    const handleOnline = () => {
      console.log('Network back online, reconnecting...')
      connect()
      refreshAll()
    }
    
    const handleOffline = () => {
      console.log('Network offline')
      setConnectionStatus('disconnected')
      setIsConnected(false)
    }
    
    // Focus handler - refresh when window regains focus
    const handleFocus = () => {
      refreshAll()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', handleFocus)
    
    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleFocus)
    }
  }, [connect, isConnected, connectionStatus, refreshAll])
  
  return (
    <RealtimeContext.Provider value={{
      isConnected,
      lastEvent,
      subscribe,
      broadcast,
      refreshAll,
      forceRefresh,
      connectionStatus,
      serverVersion,
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for components to register their refresh callbacks
export function useRealtimeRefresh(
  eventType: RealtimeEvent | RealtimeEvent[],
  refreshCallback: () => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const events = Array.isArray(eventType) ? eventType : [eventType]
    
    // Register refresh callback
    events.forEach(event => {
      if (!refreshCallbacks.has(event)) {
        refreshCallbacks.set(event, new Set())
      }
      refreshCallbacks.get(event)!.add(refreshCallback)
    })
    
    // Subscribe to real-time events
    const unsubscribe = subscribe(events, (data) => {
      refreshCallback()
    })
    
    return () => {
      unsubscribe()
      events.forEach(event => {
        refreshCallbacks.get(event)?.delete(refreshCallback)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, subscribe, ...deps])
}

// Hook for automatic data fetching with real-time updates
export function useRealtimeData<T>(
  eventType: RealtimeEvent,
  fetchFn: () => Promise<T>,
  initialValue: T,
  options: {
    refetchInterval?: number
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
): {
  data: T
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
} {
  const { isConnected } = useRealtime()
  const [data, setData] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const { refetchInterval = 60000, enabled = true, onSuccess, onError } = options
  
  const fetchData = useCallback(async () => {
    if (!enabled) return
    
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
      setLastUpdated(new Date())
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, enabled, onSuccess, onError])
  
  // Initial fetch and interval refetch
  useEffect(() => {
    fetchData()
    
    if (refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refetchInterval])
  
  // Register for real-time updates
  useRealtimeRefresh(eventType, fetchData)
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    lastUpdated,
  }
}

// Register a refresh callback globally (can be called from anywhere)
export function registerRefreshCallback(eventType: RealtimeEvent, callback: () => void): () => void {
  if (!refreshCallbacks.has(eventType)) {
    refreshCallbacks.set(eventType, new Set())
  }
  refreshCallbacks.get(eventType)!.add(callback)
  
  return () => {
    refreshCallbacks.get(eventType)?.delete(callback)
  }
}

// Trigger a global refresh for a specific event type
export function triggerRefresh(eventType: RealtimeEvent) {
  const callbacks = refreshCallbacks.get(eventType)
  if (callbacks) {
    callbacks.forEach(cb => cb())
  }
}
