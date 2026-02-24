// Sync Manager - Handles background synchronization between local storage and database
// This ensures data persists even when database is offline, and syncs when it comes back online

import { 
  STORES, 
  type StoreName, 
  type SyncOperation,
  getPendingSyncOperations, 
  removeSyncOperation, 
  updateSyncOperation,
  updateSyncMetadata,
  getSyncMetadata,
  queueForSync,
  saveLocal,
  getAllLocal
} from './offline-db'

// Sync status for UI
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error'

// Global sync state
let syncStatus: SyncStatus = 'synced'
let pendingCount: number = 0
let lastSyncTime: number = 0
let syncInProgress: boolean = false
let statusListeners: Array<(status: SyncStatus, count: number) => void> = []

// API endpoints for different operations
const API_ENDPOINTS: Record<string, string> = {
  [STORES.PATIENTS]: '/api/data',
  [STORES.VITALS]: '/api/data',
  [STORES.CONSULTATIONS]: '/api/data',
  [STORES.APPOINTMENTS]: '/api/data',
  [STORES.LAB_REQUESTS]: '/api/data',
  [STORES.LAB_RESULTS]: '/api/data',
  [STORES.PRESCRIPTIONS]: '/api/data',
  [STORES.QUEUE_ENTRIES]: '/api/data',
  [STORES.ADMISSIONS]: '/api/data',
  [STORES.ANNOUNCEMENTS]: '/api/data',
  [STORES.VOICE_NOTES]: '/api/data',
  [STORES.MEDICAL_CERTIFICATES]: '/api/data',
  [STORES.REFERRAL_LETTERS]: '/api/data',
  [STORES.DISCHARGE_SUMMARIES]: '/api/data',
  [STORES.DRUGS]: '/api/data',
  [STORES.ROSTERS]: '/api/data',
}

// Map store names to API type parameter
const STORE_TO_API_TYPE: Record<string, string> = {
  [STORES.PATIENTS]: 'patient',
  [STORES.VITALS]: 'vital',
  [STORES.CONSULTATIONS]: 'consultation',
  [STORES.APPOINTMENTS]: 'appointment',
  [STORES.LAB_REQUESTS]: 'labRequest',
  [STORES.LAB_RESULTS]: 'labResult',
  [STORES.PRESCRIPTIONS]: 'prescription',
  [STORES.QUEUE_ENTRIES]: 'queueEntry',
  [STORES.ADMISSIONS]: 'admission',
  [STORES.ANNOUNCEMENTS]: 'announcement',
  [STORES.VOICE_NOTES]: 'voiceNote',
  [STORES.MEDICAL_CERTIFICATES]: 'medicalCertificate',
  [STORES.REFERRAL_LETTERS]: 'referralLetter',
  [STORES.DISCHARGE_SUMMARIES]: 'dischargeSummary',
  [STORES.DRUGS]: 'drug',
  [STORES.ROSTERS]: 'roster',
}

// Subscribe to sync status changes
export function subscribeToSyncStatus(callback: (status: SyncStatus, count: number) => void): () => void {
  statusListeners.push(callback)
  // Immediately notify with current status
  callback(syncStatus, pendingCount)
  
  // Return unsubscribe function
  return () => {
    statusListeners = statusListeners.filter(l => l !== callback)
  }
}

// Notify all listeners of status change
function notifyStatusChange() {
  statusListeners.forEach(listener => listener(syncStatus, pendingCount))
}

// Update sync status
function setSyncStatus(newStatus: SyncStatus, count?: number) {
  syncStatus = newStatus
  if (count !== undefined) pendingCount = count
  notifyStatusChange()
}

// Get current sync status
export function getSyncStatus(): { status: SyncStatus; pendingCount: number; lastSyncTime: number } {
  return { status: syncStatus, pendingCount, lastSyncTime }
}

// Check if database is reachable
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { 
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    })
    return response.ok
  } catch {
    return false
  }
}

// Execute a single sync operation
async function executeSyncOperation(operation: SyncOperation): Promise<{ success: boolean; error?: string }> {
  const apiType = STORE_TO_API_TYPE[operation.store]
  
  try {
    let response: Response
    
    if (operation.type === 'CREATE') {
      response = await fetch(API_ENDPOINTS[operation.store], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: apiType, data: operation.data })
      })
    } else if (operation.type === 'UPDATE') {
      response = await fetch(API_ENDPOINTS[operation.store], {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: apiType, id: operation.entityId, data: operation.data })
      })
    } else if (operation.type === 'DELETE') {
      response = await fetch(`${API_ENDPOINTS[operation.store]}?type=${apiType}&id=${operation.entityId}`, {
        method: 'DELETE'
      })
    } else {
      return { success: false, error: 'Unknown operation type' }
    }
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      return { success: true }
    } else {
      return { success: false, error: result.error || `HTTP ${response.status}` }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' }
  }
}

// Process all pending sync operations
export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (syncInProgress) {
    console.log('Sync already in progress, skipping...')
    return { processed: 0, failed: 0 }
  }
  
  syncInProgress = true
  setSyncStatus('syncing')
  
  const operations = await getPendingSyncOperations()
  
  if (operations.length === 0) {
    syncInProgress = false
    setSyncStatus('synced', 0)
    lastSyncTime = Date.now()
    return { processed: 0, failed: 0 }
  }
  
  console.log(`Processing ${operations.length} pending sync operations...`)
  
  let processed = 0
  let failed = 0
  const MAX_RETRIES = 5
  
  for (const operation of operations) {
    // Skip operations that have exceeded max retries
    if (operation.retryCount >= MAX_RETRIES) {
      console.warn(`Operation ${operation.id} exceeded max retries, keeping in local storage`)
      failed++
      continue
    }
    
    const result = await executeSyncOperation(operation)
    
    if (result.success) {
      await removeSyncOperation(operation.id)
      processed++
      console.log(`Synced: ${operation.type} ${operation.store} ${operation.entityId}`)
    } else {
      await updateSyncOperation(operation.id, {
        retryCount: operation.retryCount + 1,
        lastError: result.error
      })
      failed++
      console.warn(`Failed to sync ${operation.id}:`, result.error)
    }
  }
  
  syncInProgress = false
  
  // Update status based on results
  const remainingOps = await getPendingSyncOperations()
  
  if (remainingOps.length === 0) {
    setSyncStatus('synced', 0)
    await updateSyncMetadata('success')
  } else if (processed > 0) {
    setSyncStatus('pending', remainingOps.length)
    await updateSyncMetadata('partial', failed)
  } else {
    setSyncStatus('offline', remainingOps.length)
    await updateSyncMetadata('failed', failed)
  }
  
  lastSyncTime = Date.now()
  
  return { processed, failed }
}

// Start background sync (call this on app init)
let syncInterval: NodeJS.Timeout | null = null

export function startBackgroundSync(intervalMs: number = 30000): void {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
  
  // Initial sync
  processSyncQueue()
  
  // Set up periodic sync
  syncInterval = setInterval(async () => {
    const dbOnline = await checkDatabaseConnection()
    
    if (dbOnline) {
      await processSyncQueue()
    } else {
      setSyncStatus('offline', pendingCount)
    }
  }, intervalMs)
  
  // Also sync when coming back online
  window.addEventListener('online', () => {
    console.log('Network back online, syncing...')
    processSyncQueue()
  })
  
  console.log('Background sync started')
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// ============== OFFLINE-FIRST DATA OPERATIONS ==============

// Save data offline-first: save locally immediately, then try to sync
export async function offlineFirstSave<T extends { id: string }>(
  storeName: StoreName,
  data: T,
  skipSync: boolean = false
): Promise<{ success: boolean; localOnly: boolean; error?: string }> {
  // 1. ALWAYS save locally first - this ensures data is never lost
  try {
    await saveLocal(storeName, data)
    console.log(`✓ Saved locally: ${storeName}/${data.id}`)
  } catch (error: any) {
    console.error(`Failed to save locally: ${storeName}/${data.id}`, error)
    return { success: false, localOnly: false, error: 'Failed to save locally' }
  }
  
  // 2. Try to sync immediately
  if (!skipSync) {
    try {
      const result = await executeSyncOperation({
        id: '',
        type: 'CREATE',
        store: storeName,
        data,
        entityId: data.id,
        timestamp: Date.now(),
        retryCount: 0
      })
      
      if (result.success) {
        setSyncStatus('synced', 0)
        return { success: true, localOnly: false }
      }
    } catch (error) {
      console.log('Immediate sync failed, will retry later')
    }
    
    // 3. If sync failed, queue for later
    await queueForSync({
      type: 'CREATE',
      store: storeName,
      data,
      entityId: data.id
    })
    
    const ops = await getPendingSyncOperations()
    setSyncStatus('pending', ops.length)
    
    return { success: true, localOnly: true }
  }
  
  return { success: true, localOnly: true }
}

// Update data offline-first
export async function offlineFirstUpdate<T extends { id: string }>(
  storeName: StoreName,
  id: string,
  data: Partial<T>,
  skipSync: boolean = false
): Promise<{ success: boolean; localOnly: boolean; error?: string }> {
  // 1. Save locally first
  try {
    const existing = await getAllLocal<T>(storeName)
    const item = existing.find(i => (i as any).id === id)
    
    if (item) {
      await saveLocal(storeName, { ...item, ...data } as T)
    }
    
    console.log(`✓ Updated locally: ${storeName}/${id}`)
  } catch (error: any) {
    console.error(`Failed to update locally: ${storeName}/${id}`, error)
    return { success: false, localOnly: false, error: 'Failed to update locally' }
  }
  
  // 2. Try to sync immediately
  if (!skipSync) {
    try {
      const result = await executeSyncOperation({
        id: '',
        type: 'UPDATE',
        store: storeName,
        data,
        entityId: id,
        timestamp: Date.now(),
        retryCount: 0
      })
      
      if (result.success) {
        return { success: true, localOnly: false }
      }
    } catch (error) {
      console.log('Immediate sync failed, will retry later')
    }
    
    // 3. Queue for later
    await queueForSync({
      type: 'UPDATE',
      store: storeName,
      data,
      entityId: id
    })
    
    const ops = await getPendingSyncOperations()
    setSyncStatus('pending', ops.length)
    
    return { success: true, localOnly: true }
  }
  
  return { success: true, localOnly: true }
}

// Delete data offline-first
export async function offlineFirstDelete(
  storeName: StoreName,
  id: string,
  skipSync: boolean = false
): Promise<{ success: boolean; localOnly: boolean; error?: string }> {
  // 1. Delete locally first
  try {
    const { deleteLocal } = await import('./offline-db')
    await deleteLocal(storeName, id)
    console.log(`✓ Deleted locally: ${storeName}/${id}`)
  } catch (error: any) {
    console.error(`Failed to delete locally: ${storeName}/${id}`, error)
    return { success: false, localOnly: false, error: 'Failed to delete locally' }
  }
  
  // 2. Try to sync immediately
  if (!skipSync) {
    try {
      const result = await executeSyncOperation({
        id: '',
        type: 'DELETE',
        store: storeName,
        entityId: id,
        timestamp: Date.now(),
        retryCount: 0
      })
      
      if (result.success) {
        return { success: true, localOnly: false }
      }
    } catch (error) {
      console.log('Immediate sync failed, will retry later')
    }
    
    // 3. Queue for later
    await queueForSync({
      type: 'DELETE',
      store: storeName,
      entityId: id
    })
    
    const ops = await getPendingSyncOperations()
    setSyncStatus('pending', ops.length)
    
    return { success: true, localOnly: true }
  }
  
  return { success: true, localOnly: true }
}

// Initialize sync on module load
export async function initSyncManager(): Promise<void> {
  // Load pending count
  const ops = await getPendingSyncOperations()
  pendingCount = ops.length
  
  // Load last sync time
  const metadata = await getSyncMetadata()
  if (metadata) {
    lastSyncTime = metadata.lastSyncTime
    if (metadata.status === 'failed' || ops.length > 0) {
      setSyncStatus('pending', ops.length)
    }
  }
  
  console.log(`Sync manager initialized. Pending operations: ${pendingCount}`)
}
