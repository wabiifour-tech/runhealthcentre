'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRealtime, registerRefreshCallback, triggerRefresh, type RealtimeEvent } from './realtime-context'

/**
 * Hook for automatic data synchronization with real-time updates
 * 
 * This hook provides:
 * 1. Real-time SSE connection for instant updates
 * 2. Automatic data refresh when changes are detected
 * 3. Version tracking for deployment detection
 * 4. Smart polling fallback when SSE is unavailable
 */
export function useAutoSync(options: {
  // Function to call when data needs to be refreshed
  onRefresh: () => Promise<void> | void
  // Events to subscribe to for triggering refresh
  events?: RealtimeEvent[]
  // Polling interval in milliseconds (default: 5000, set to 0 to disable)
  pollInterval?: number
  // Whether to refresh on window focus (default: true)
  refreshOnFocus?: boolean
  // Whether to refresh on visibility change (default: true)
  refreshOnVisibility?: boolean
  // Whether to refresh on reconnect (default: true)
  refreshOnReconnect?: boolean
  // Whether auto-sync is enabled (default: true)
  enabled?: boolean
}) {
  const {
    onRefresh,
    events = ['patients_updated', 'users_updated', 'consultations_updated', 'queue_updated', 'routing_updated', 'vitals_updated'],
    pollInterval = 5000,
    refreshOnFocus = true,
    refreshOnVisibility = true,
    refreshOnReconnect = true,
    enabled = true
  } = options
  
  const { isConnected, subscribe, connectionStatus } = useRealtime()
  const isRefreshingRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)
  const mountedRef = useRef(false)
  
  // Wrapped refresh function with race condition protection and debouncing
  const safeRefresh = useCallback(async () => {
    if (!enabled || isRefreshingRef.current) return
    
    // Debounce: Don't refresh more than once per 500ms
    const now = Date.now()
    if (now - lastRefreshRef.current < 500) return
    
    isRefreshingRef.current = true
    lastRefreshRef.current = now
    
    try {
      await onRefresh()
    } catch (error) {
      console.error('[AutoSync] Refresh error:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [onRefresh, enabled])
  
  // Register refresh callback globally
  useEffect(() => {
    if (!enabled) return
    
    const unsubscribers: (() => void)[] = []
    
    events.forEach(event => {
      const unsub = registerRefreshCallback(event, safeRefresh)
      unsubscribers.push(unsub)
    })
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [events, safeRefresh, enabled])
  
  // Subscribe to real-time events
  useEffect(() => {
    if (!enabled) return
    
    const unsubscribe = subscribe(events, (data) => {
      console.log('[AutoSync] Real-time event received:', data)
      safeRefresh()
    })
    
    return unsubscribe
  }, [subscribe, events, safeRefresh, enabled])
  
  // Polling fallback
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return
    
    const interval = setInterval(() => {
      // Only poll if SSE is not connected
      if (!isConnected) {
        safeRefresh()
      }
    }, pollInterval)
    
    return () => clearInterval(interval)
  }, [pollInterval, isConnected, safeRefresh, enabled])
  
  // Refresh on window focus
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return
    
    const handleFocus = () => {
      console.log('[AutoSync] Window focused, refreshing...')
      safeRefresh()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshOnFocus, safeRefresh, enabled])
  
  // Refresh on visibility change
  useEffect(() => {
    if (!enabled || !refreshOnVisibility) return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AutoSync] Tab visible, refreshing...')
        safeRefresh()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshOnVisibility, safeRefresh, enabled])
  
  // Refresh on reconnect
  useEffect(() => {
    if (!enabled || !refreshOnReconnect) return
    
    if (connectionStatus === 'connected' && mountedRef.current) {
      console.log('[AutoSync] Reconnected, refreshing...')
      safeRefresh()
    }
  }, [connectionStatus, refreshOnReconnect, safeRefresh, enabled])
  
  // Track mounted state
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Manual refresh trigger
  const refresh = useCallback(() => {
    return safeRefresh()
  }, [safeRefresh])
  
  return {
    isConnected,
    connectionStatus,
    refresh,
    isRefreshing: isRefreshingRef.current
  }
}

/**
 * Hook for broadcasting data changes to other clients
 */
export function useBroadcast() {
  const { broadcast, forceRefresh } = useRealtime()
  
  const broadcastChange = useCallback(async (eventType: RealtimeEvent, data?: any) => {
    // Broadcast to other clients
    await broadcast(eventType, data)
    // Trigger local refresh
    triggerRefresh(eventType)
  }, [broadcast])
  
  return {
    broadcastChange,
    forceRefresh
  }
}

/**
 * Hook for deployment version detection
 * Automatically clears caches and refreshes when a new deployment is detected
 */
export function useDeploymentDetection() {
  const { serverVersion, connectionStatus } = useRealtime()
  
  useEffect(() => {
    const handleNewVersion = async () => {
      if (connectionStatus === 'connected' && serverVersion) {
        const storedVersion = localStorage.getItem('ruhc_build_version')
        
        if (storedVersion && storedVersion !== serverVersion) {
          console.log('[DeploymentDetection] New version detected:', serverVersion)
          
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
          }
          
          // Update stored version
          localStorage.setItem('ruhc_build_version', serverVersion)
          
          // Dispatch custom event for app to handle
          window.dispatchEvent(new CustomEvent('new-deployment', { 
            detail: { version: serverVersion } 
          }))
        }
      }
    }
    
    handleNewVersion()
  }, [serverVersion, connectionStatus])
  
  return {
    serverVersion,
    isNewDeployment: serverVersion !== localStorage.getItem('ruhc_build_version')
  }
}

/**
 * Utility to trigger a global data refresh from anywhere in the app
 */
export { triggerRefresh }
