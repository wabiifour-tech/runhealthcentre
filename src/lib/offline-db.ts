// Offline-First Database Service
// Uses IndexedDB for robust local storage that persists even when database is offline
// All data is saved locally first, then synced to the server when available

const DB_NAME = 'RUHC_OfflineDB'
const DB_VERSION = 1

// Store names for different data types
export const STORES = {
  PATIENTS: 'patients',
  VITALS: 'vitals',
  CONSULTATIONS: 'consultations',
  APPOINTMENTS: 'appointments',
  LAB_REQUESTS: 'labRequests',
  LAB_RESULTS: 'labResults',
  PRESCRIPTIONS: 'prescriptions',
  QUEUE_ENTRIES: 'queueEntries',
  ADMISSIONS: 'admissions',
  ANNOUNCEMENTS: 'announcements',
  VOICE_NOTES: 'voiceNotes',
  MEDICAL_CERTIFICATES: 'medicalCertificates',
  REFERRAL_LETTERS: 'referralLetters',
  DISCHARGE_SUMMARIES: 'dischargeSummaries',
  DRUGS: 'drugs',
  ROSTERS: 'rosters',
  SYNC_QUEUE: 'syncQueue', // For pending sync operations
  SYNC_METADATA: 'syncMetadata' // Track last sync times
} as const

export type StoreName = typeof STORES[keyof typeof STORES]

// Sync operation types
export interface SyncOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  store: StoreName
  data?: any
  entityId: string
  timestamp: number
  retryCount: number
  lastError?: string
}

// IndexedDB connection
let db: IDBDatabase | null = null

// Initialize the database
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      console.log('Offline DB initialized successfully')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create object stores for all data types
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' })
          
          // Add indexes for common queries
          if (storeName === STORES.PATIENTS) {
            store.createIndex('ruhcCode', 'ruhcCode', { unique: true })
            store.createIndex('matricNumber', 'matricNumber', { unique: false })
          } else if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('store', 'store', { unique: false })
          }
        }
      })

      console.log('Offline DB schema created/updated')
    }
  })
}

// Get a transaction and store
async function getStore(storeName: StoreName, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const database = await initOfflineDB()
  const transaction = database.transaction(storeName, mode)
  return transaction.objectStore(storeName)
}

// Save an item to local storage
export async function saveLocal<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  
  return new Promise((resolve, reject) => {
    const request = store.put({ ...item, _localSavedAt: Date.now() })
    
    request.onsuccess = () => {
      console.log(`Saved to local ${storeName}:`, item.id)
      resolve()
    }
    
    request.onerror = () => {
      console.error(`Failed to save to local ${storeName}:`, request.error)
      reject(request.error)
    }
  })
}

// Get an item from local storage
export async function getLocal<T>(storeName: StoreName, id: string): Promise<T | null> {
  const store = await getStore(storeName, 'readonly')
  
  return new Promise((resolve, reject) => {
    const request = store.get(id)
    
    request.onsuccess = () => {
      resolve(request.result || null)
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Get all items from local storage
export async function getAllLocal<T>(storeName: StoreName): Promise<T[]> {
  const store = await getStore(storeName, 'readonly')
  
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    
    request.onsuccess = () => {
      resolve(request.result || [])
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Delete an item from local storage
export async function deleteLocal(storeName: StoreName, id: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    
    request.onsuccess = () => {
      console.log(`Deleted from local ${storeName}:`, id)
      resolve()
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Clear all items from a store
export async function clearLocal(storeName: StoreName): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  
  return new Promise((resolve, reject) => {
    const request = store.clear()
    
    request.onsuccess = () => {
      console.log(`Cleared local ${storeName}`)
      resolve()
    }
    
    request.onerror = () => {
      reject(request.error)
    }
  })
}

// ============== SYNC QUEUE OPERATIONS ==============

// Add an operation to the sync queue
export async function queueForSync(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const syncOp: SyncOperation = {
    ...operation,
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0
  }
  
  await saveLocal(STORES.SYNC_QUEUE, syncOp)
  console.log('Queued for sync:', syncOp)
}

// Get all pending sync operations
export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  return getAllLocal<SyncOperation>(STORES.SYNC_QUEUE)
}

// Remove a sync operation after successful sync
export async function removeSyncOperation(id: string): Promise<void> {
  await deleteLocal(STORES.SYNC_QUEUE, id)
}

// Update sync operation (increment retry count, add error)
export async function updateSyncOperation(id: string, updates: Partial<SyncOperation>): Promise<void> {
  const op = await getLocal<SyncOperation>(STORES.SYNC_QUEUE, id)
  if (op) {
    await saveLocal(STORES.SYNC_QUEUE, { ...op, ...updates })
  }
}

// Get count of pending sync operations
export async function getPendingSyncCount(): Promise<number> {
  const ops = await getPendingSyncOperations()
  return ops.length
}

// ============== BULK OPERATIONS ==============

// Save multiple items at once
export async function saveAllLocal<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  
  return new Promise((resolve, reject) => {
    const transaction = store.transaction
    
    items.forEach(item => {
      store.put({ ...item, _localSavedAt: Date.now() })
    })
    
    transaction.oncomplete = () => {
      console.log(`Saved ${items.length} items to local ${storeName}`)
      resolve()
    }
    
    transaction.onerror = () => {
      reject(transaction.error)
    }
  })
}

// ============== SYNC METADATA ==============

interface SyncMetadata {
  id: string
  lastSyncTime: number
  status: 'success' | 'partial' | 'failed'
  errorCount: number
}

export async function updateSyncMetadata(status: 'success' | 'partial' | 'failed', errorCount: number = 0): Promise<void> {
  const metadata: SyncMetadata = {
    id: 'sync_status',
    lastSyncTime: Date.now(),
    status,
    errorCount
  }
  await saveLocal(STORES.SYNC_METADATA, metadata)
}

export async function getSyncMetadata(): Promise<SyncMetadata | null> {
  return getLocal<SyncMetadata>(STORES.SYNC_METADATA, 'sync_status')
}

// ============== UTILITY FUNCTIONS ==============

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

// Get total local storage size estimate
export async function getLocalStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    }
  }
  return null
}

// Export all local data (for backup)
export async function exportAllLocalData(): Promise<Record<string, any[]>> {
  const data: Record<string, any[]> = {}
  
  for (const storeName of Object.values(STORES)) {
    if (storeName !== STORES.SYNC_QUEUE && storeName !== STORES.SYNC_METADATA) {
      data[storeName] = await getAllLocal(storeName)
    }
  }
  
  return data
}

// Import data (for restore)
export async function importLocalData(data: Record<string, any[]>): Promise<void> {
  for (const [storeName, items] of Object.entries(data)) {
    if (Object.values(STORES).includes(storeName as StoreName)) {
      await saveAllLocal(storeName as StoreName, items)
    }
  }
}
