// React Hook for Offline-First Data Operations
// Use this hook in components to access offline-first save functionality and sync status

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  STORES, 
  type StoreName, 
  initOfflineDB, 
  saveLocal, 
  getAllLocal, 
  deleteLocal,
  getPendingSyncCount 
} from './offline-db'
import {
  offlineFirstSave,
  offlineFirstUpdate,
  offlineFirstDelete,
  startBackgroundSync,
  stopBackgroundSync,
  subscribeToSyncStatus,
  initSyncManager,
  processSyncQueue,
  type SyncStatus
} from './sync-manager'

// Hook for sync status
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [pendingCount, setPendingCount] = useState(0)
  
  useEffect(() => {
    // Initialize
    initSyncManager().then(() => {
      // Start background sync
      startBackgroundSync(15000) // Sync every 15 seconds
    })
    
    // Subscribe to status changes
    const unsubscribe = subscribeToSyncStatus((newStatus, count) => {
      setStatus(newStatus)
      setPendingCount(count)
    })
    
    return () => {
      unsubscribe()
      stopBackgroundSync()
    }
  }, [])
  
  const syncNow = useCallback(async () => {
    await processSyncQueue()
  }, [])
  
  return { status, pendingCount, syncNow }
}

// Hook for offline-first patient operations
export function useOfflinePatients() {
  const savePatient = useCallback(async (patient: any) => {
    return offlineFirstSave(STORES.PATIENTS, patient)
  }, [])
  
  const updatePatient = useCallback(async (id: string, data: any) => {
    return offlineFirstUpdate(STORES.PATIENTS, id, data)
  }, [])
  
  const deletePatient = useCallback(async (id: string) => {
    return offlineFirstDelete(STORES.PATIENTS, id)
  }, [])
  
  const getLocalPatients = useCallback(async () => {
    return getAllLocal(STORES.PATIENTS)
  }, [])
  
  return { savePatient, updatePatient, deletePatient, getLocalPatients }
}

// Hook for offline-first vitals operations
export function useOfflineVitals() {
  const saveVital = useCallback(async (vital: any) => {
    return offlineFirstSave(STORES.VITALS, vital)
  }, [])
  
  const getLocalVitals = useCallback(async () => {
    return getAllLocal(STORES.VITALS)
  }, [])
  
  return { saveVital, getLocalVitals }
}

// Hook for offline-first consultations operations
export function useOfflineConsultations() {
  const saveConsultation = useCallback(async (consultation: any) => {
    return offlineFirstSave(STORES.CONSULTATIONS, consultation)
  }, [])
  
  const updateConsultation = useCallback(async (id: string, data: any) => {
    return offlineFirstUpdate(STORES.CONSULTATIONS, id, data)
  }, [])
  
  const getLocalConsultations = useCallback(async () => {
    return getAllLocal(STORES.CONSULTATIONS)
  }, [])
  
  return { saveConsultation, updateConsultation, getLocalConsultations }
}

// Hook for offline-first appointments operations
export function useOfflineAppointments() {
  const saveAppointment = useCallback(async (appointment: any) => {
    return offlineFirstSave(STORES.APPOINTMENTS, appointment)
  }, [])
  
  const updateAppointment = useCallback(async (id: string, data: any) => {
    return offlineFirstUpdate(STORES.APPOINTMENTS, id, data)
  }, [])
  
  const getLocalAppointments = useCallback(async () => {
    return getAllLocal(STORES.APPOINTMENTS)
  }, [])
  
  return { saveAppointment, updateAppointment, getLocalAppointments }
}

// Hook for offline-first lab requests operations
export function useOfflineLabRequests() {
  const saveLabRequest = useCallback(async (labRequest: any) => {
    return offlineFirstSave(STORES.LAB_REQUESTS, labRequest)
  }, [])
  
  const updateLabRequest = useCallback(async (id: string, data: any) => {
    return offlineFirstUpdate(STORES.LAB_REQUESTS, id, data)
  }, [])
  
  const getLocalLabRequests = useCallback(async () => {
    return getAllLocal(STORES.LAB_REQUESTS)
  }, [])
  
  return { saveLabRequest, updateLabRequest, getLocalLabRequests }
}

// Generic offline-first hook for any store
export function useOfflineStore<T extends { id: string }>(storeName: StoreName) {
  const save = useCallback(async (item: T) => {
    return offlineFirstSave(storeName, item)
  }, [storeName])
  
  const update = useCallback(async (id: string, data: Partial<T>) => {
    return offlineFirstUpdate(storeName, id, data)
  }, [storeName])
  
  const remove = useCallback(async (id: string) => {
    return offlineFirstDelete(storeName, id)
  }, [storeName])
  
  const getAll = useCallback(async () => {
    return getAllLocal<T>(storeName)
  }, [storeName])
  
  return { save, update, remove, getAll }
}

// Initialize offline DB on client side
export function useOfflineDBInit() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    initOfflineDB()
      .then(() => {
        setIsReady(true)
        console.log('Offline DB ready')
      })
      .catch((err) => {
        setError(err.message)
        console.error('Failed to initialize offline DB:', err)
      })
  }, [])
  
  return { isReady, error }
}

// Sync status indicator component helper
export function getSyncStatusDisplay(status: SyncStatus, pendingCount: number): {
  color: string
  bgColor: string
  text: string
  icon: 'check' | 'sync' | 'clock' | 'wifi-off' | 'alert'
} {
  switch (status) {
    case 'synced':
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'All data synced',
        icon: 'check'
      }
    case 'syncing':
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: 'Syncing...',
        icon: 'sync'
      }
    case 'pending':
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        text: `${pendingCount} pending sync`,
        icon: 'clock'
      }
    case 'offline':
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        text: 'Offline - data saved locally',
        icon: 'wifi-off'
      }
    case 'error':
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: 'Sync error',
        icon: 'alert'
      }
    default:
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        text: 'Unknown status',
        icon: 'alert'
      }
  }
}
