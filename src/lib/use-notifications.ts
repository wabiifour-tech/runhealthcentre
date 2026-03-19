// ============================================
// USE NOTIFICATIONS HOOK - WhatsApp-Style Notification Management
// Real-time notification subscription and management
// ============================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRealtime } from './realtime-context'

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string
  type: string
  category: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  senderId?: string
  senderName?: string
  senderRole?: string
  data?: Record<string, any>
  actionUrl?: string
  createdAt: string
  readAt?: string
  deliveredAt?: string
  recipientStatus?: string
  recipientReadAt?: string
}

export interface NotificationStats {
  unreadCount: number
  totalCount: number
  criticalCount: number
}

export interface UseNotificationsOptions {
  userId: string
  autoMarkDelivered?: boolean
  pollingInterval?: number
  enabled?: boolean
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  totalCount: number
  isLoading: boolean
  error: Error | null
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  hasUnread: boolean
  hasCritical: boolean
  latestNotification: Notification | null
}

// ============================================
// NOTIFICATION HOOK
// ============================================

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const { 
    userId, 
    autoMarkDelivered = true, 
    pollingInterval = 30000,
    enabled = true 
  } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  
  const { subscribe, isConnected } = useRealtime()
  const previousNotificationsRef = useRef<Notification[]>([])

  // ============================================
  // FETCH NOTIFICATIONS
  // ============================================

  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/notifications?userId=${userId}&limit=100`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      
      const newNotifications = data.notifications || []
      const newUnreadCount = parseInt(data.unreadCount) || 0

      // Check for new notifications (for toast/alert)
      if (previousNotificationsRef.current.length > 0) {
        const previousIds = new Set(previousNotificationsRef.current.map(n => n.id))
        const newOnes = newNotifications.filter((n: Notification) => !previousIds.has(n.id))
        
        if (newOnes.length > 0) {
          // Set the latest new notification
          setLatestNotification(newOnes[0])
        }
      }

      previousNotificationsRef.current = newNotifications
      setNotifications(newNotifications)
      setUnreadCount(newUnreadCount)
      setTotalCount(data.totalCount || newNotifications.length)

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, enabled])

  // ============================================
  // MARK AS READ
  // ============================================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, status: 'read', readAt: new Date().toISOString(), recipientStatus: 'read' }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, status: 'read', readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [userId])

  // ============================================
  // DELETE NOTIFICATION
  // ============================================

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setTotalCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [])

  // ============================================
  // CLEAR ALL
  // ============================================

  const clearAll = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&clearAll=true`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        setTotalCount(0)
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }, [userId])

  // ============================================
  // REAL-TIME SUBSCRIPTION
  // ============================================

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchNotifications()

    // Subscribe to real-time updates
    const unsubscribe = subscribe(['notifications_updated'], () => {
      fetchNotifications()
    })

    // Polling fallback
    const intervalId = setInterval(fetchNotifications, pollingInterval)

    return () => {
      unsubscribe()
      clearInterval(intervalId)
    }
  }, [enabled, fetchNotifications, subscribe, pollingInterval])

  // ============================================
  // AUTO MARK DELIVERED
  // ============================================

  useEffect(() => {
    if (!autoMarkDelivered || notifications.length === 0) return

    // Mark unread notifications as delivered
    const undelivered = notifications.filter(
      n => n.status === 'pending' || n.status === 'sent'
    )

    if (undelivered.length > 0) {
      fetch('/api/notifications/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          notificationIds: undelivered.map(n => n.id) 
        })
      }).catch(() => {
        // Silently fail
      })
    }
  }, [notifications, autoMarkDelivered, userId])

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const hasUnread = unreadCount > 0
  const hasCritical = notifications.some(
    n => n.priority === 'critical' && n.status !== 'read'
  )

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    hasUnread,
    hasCritical,
    latestNotification
  }
}

// ============================================
// NOTIFICATION BADGE COMPONENT HELPER
// ============================================

export function getNotificationBadgeProps(unreadCount: number): {
  count: number
  show: boolean
  variant: 'default' | 'critical'
  label: string
} {
  const show = unreadCount > 0
  const variant = unreadCount > 10 ? 'critical' : 'default'
  const count = unreadCount > 99 ? '99+' : unreadCount
  const label = `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`

  return {
    count: typeof count === 'string' ? 99 : count,
    show,
    variant,
    label
  }
}

// ============================================
// NOTIFICATION SOUND HELPER
// ============================================

export function playNotificationSound(priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): void {
  if (typeof window === 'undefined') return

  // Create audio context for notification sounds
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different sounds for different priorities
    const frequencies = {
      low: [440],
      normal: [523, 659], // C5, E5
      high: [659, 784, 659], // E5, G5, E5
      critical: [880, 988, 880, 988] // A5, B5, A5, B5 (urgent pattern)
    }

    const notes = frequencies[priority] || frequencies.normal
    const duration = priority === 'critical' ? 0.15 : 0.1

    let time = audioContext.currentTime
    notes.forEach(freq => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(audioContext.destination)
      
      osc.frequency.value = freq
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration)
      
      osc.start(time)
      osc.stop(time + duration)
      
      time += duration
    })

  } catch (e) {
    // Audio not supported or blocked
    console.log('Notification sound not played:', e)
  }
}

// ============================================
// NOTIFICATION TOAST HELPER
// ============================================

export function showNotificationToast(notification: Notification): {
  title: string
  description: string
  variant: 'default' | 'destructive'
  action?: string
} {
  const isCritical = notification.priority === 'critical'
  
  return {
    title: notification.title,
    description: notification.message.length > 100 
      ? notification.message.substring(0, 100) + '...'
      : notification.message,
    variant: isCritical ? 'destructive' : 'default',
    action: notification.actionUrl ? 'View' : undefined
  }
}
