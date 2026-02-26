/**
 * Session Management Utilities
 * Handles session timeout, activity tracking, and auto-logout
 */

import { useEffect, useRef, useCallback } from 'react'

// Configuration
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_TIME_MS = 5 * 60 * 1000 // 5 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']

interface SessionConfig {
  timeoutMs?: number
  warningMs?: number
  onWarning?: () => void
  onTimeout?: () => void
  onActivity?: () => void
}

interface SessionState {
  lastActivity: number
  isWarningShown: boolean
  isTimedOut: boolean
}

/**
 * Hook for managing session timeout
 */
export function useSessionTimeout(config: SessionConfig) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warningMs = WARNING_TIME_MS,
    onWarning,
    onTimeout,
    onActivity
  } = config
  
  const stateRef = useRef<SessionState>({
    lastActivity: Date.now(),
    isWarningShown: false,
    isTimedOut: false
  })
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
  }, [])
  
  const startTimers = useCallback(() => {
    clearTimers()
    
    const now = Date.now()
    stateRef.current.lastActivity = now
    stateRef.current.isWarningShown = false
    
    // Set warning timer
    warningRef.current = setTimeout(() => {
      stateRef.current.isWarningShown = true
      onWarning?.()
    }, timeoutMs - warningMs)
    
    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      stateRef.current.isTimedOut = true
      onTimeout?.()
    }, timeoutMs)
  }, [timeoutMs, warningMs, onWarning, onTimeout, clearTimers])
  
  const handleActivity = useCallback(() => {
    if (stateRef.current.isTimedOut) return
    
    stateRef.current.lastActivity = Date.now()
    
    if (stateRef.current.isWarningShown) {
      stateRef.current.isWarningShown = false
      onActivity?.()
    }
    
    startTimers()
  }, [startTimers, onActivity])
  
  const extendSession = useCallback(() => {
    stateRef.current.isTimedOut = false
    stateRef.current.isWarningShown = false
    startTimers()
  }, [startTimers])
  
  const getTimeUntilTimeout = useCallback(() => {
    const elapsed = Date.now() - stateRef.current.lastActivity
    return Math.max(0, timeoutMs - elapsed)
  }, [timeoutMs])
  
  const getFormattedTimeRemaining = useCallback(() => {
    const remaining = getTimeUntilTimeout()
    const minutes = Math.floor(remaining / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [getTimeUntilTimeout])
  
  useEffect(() => {
    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })
    
    // Start the timers
    startTimers()
    
    return () => {
      // Cleanup
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearTimers()
    }
  }, [handleActivity, startTimers, clearTimers])
  
  return {
    extendSession,
    getTimeUntilTimeout,
    getFormattedTimeRemaining,
    isWarningShown: stateRef.current.isWarningShown,
    isTimedOut: stateRef.current.isTimedOut
  }
}

/**
 * Get session timeout setting from localStorage
 */
export function getSessionTimeout(): number {
  if (typeof window === 'undefined') return DEFAULT_TIMEOUT_MS
  
  const stored = localStorage.getItem('run_hms_session_timeout')
  if (stored) {
    const minutes = parseInt(stored, 10)
    if (!isNaN(minutes) && minutes >= 5 && minutes <= 120) {
      return minutes * 60 * 1000
    }
  }
  
  return DEFAULT_TIMEOUT_MS
}

/**
 * Set session timeout setting
 */
export function setSessionTimeout(minutes: number): void {
  if (typeof window === 'undefined') return
  
  if (minutes >= 5 && minutes <= 120) {
    localStorage.setItem('run_hms_session_timeout', minutes.toString())
  }
}

/**
 * Format milliseconds to human readable time
 */
export function formatSessionTime(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
}

/**
 * Default session timeout options for settings
 */
export const SESSION_TIMEOUT_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes (default)', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 }
]
