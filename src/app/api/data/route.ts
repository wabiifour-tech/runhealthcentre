import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisConfigured, REDIS_KEYS } from '@/lib/redis'

// Data types that can be synced
const DATA_TYPES = {
  patients: REDIS_KEYS.PATIENTS,
  consultations: REDIS_KEYS.CONSULTATIONS,
  vitals: REDIS_KEYS.VITALS,
  appointments: REDIS_KEYS.APPOINTMENTS,
  labRequests: REDIS_KEYS.LAB_REQUESTS,
  labResults: REDIS_KEYS.LAB_RESULTS,
  prescriptions: REDIS_KEYS.PRESCRIPTIONS,
  payments: REDIS_KEYS.PAYMENTS,
  announcements: REDIS_KEYS.ANNOUNCEMENTS,
  queueEntries: REDIS_KEYS.QUEUE,
  users: REDIS_KEYS.USERS,
} as const

type DataType = keyof typeof DATA_TYPES

// In-memory fallback storage
const memoryStore: Record<string, any[]> = {}

// Get data from storage
async function getData(type: DataType): Promise<any[]> {
  const key = DATA_TYPES[type]
  
  if (isRedisConfigured()) {
    try {
      const data = await redis.get(key)
      if (data && Array.isArray(data)) {
        return data
      }
      return []
    } catch (error) {
      console.error(`Redis error getting ${type}:`, error)
      return memoryStore[type] || []
    }
  }
  
  return memoryStore[type] || []
}

// Save data to storage
async function saveData(type: DataType, data: any[]): Promise<void> {
  const key = DATA_TYPES[type]
  
  if (isRedisConfigured()) {
    try {
      await redis.set(key, data)
    } catch (error) {
      console.error(`Redis error saving ${type}:`, error)
      memoryStore[type] = data
    }
  } else {
    memoryStore[type] = data
  }
}

// Get all data at once
async function getAllData(): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {}
  
  for (const type of Object.keys(DATA_TYPES) as DataType[]) {
    result[type] = await getData(type)
  }
  
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as DataType | null
    
    if (type) {
      // Get specific data type
      if (!DATA_TYPES[type]) {
        return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
      const data = await getData(type)
      return NextResponse.json({ success: true, data, persistent: isRedisConfigured() })
    }
    
    // Get all data
    const allData = await getAllData()
    return NextResponse.json({ 
      success: true, 
      data: allData, 
      persistent: isRedisConfigured() 
    })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, type, data, types } = body
    
    // Sync multiple data types at once
    if (action === 'syncAll' && types) {
      const results: Record<string, any[]> = {}
      
      for (const [dataType, dataArray] of Object.entries(types)) {
        if (DATA_TYPES[dataType as DataType] && Array.isArray(dataArray)) {
          await saveData(dataType as DataType, dataArray as any[])
          results[dataType] = dataArray
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        synced: Object.keys(results),
        persistent: isRedisConfigured() 
      })
    }
    
    // Sync single data type
    if (action === 'sync' && type && Array.isArray(data)) {
      if (!DATA_TYPES[type as DataType]) {
        return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
      
      await saveData(type as DataType, data)
      return NextResponse.json({ success: true, persistent: isRedisConfigured() })
    }
    
    // Add single item
    if (action === 'add' && type && data) {
      if (!DATA_TYPES[type as DataType]) {
        return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
      
      const currentData = await getData(type as DataType)
      const newItem = {
        ...data,
        id: data.id || `${type}_${Date.now()}`,
        createdAt: data.createdAt || new Date().toISOString()
      }
      currentData.push(newItem)
      await saveData(type as DataType, currentData)
      
      return NextResponse.json({ success: true, item: newItem, persistent: isRedisConfigured() })
    }
    
    // Update single item
    if (action === 'update' && type && data && data.id) {
      if (!DATA_TYPES[type as DataType]) {
        return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
      
      const currentData = await getData(type as DataType)
      const updatedData = currentData.map(item => 
        item.id === data.id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      )
      await saveData(type as DataType, updatedData)
      
      return NextResponse.json({ success: true, persistent: isRedisConfigured() })
    }
    
    // Delete single item
    if (action === 'delete' && type && data && data.id) {
      if (!DATA_TYPES[type as DataType]) {
        return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
      
      const currentData = await getData(type as DataType)
      const filteredData = currentData.filter(item => item.id !== data.id)
      await saveData(type as DataType, filteredData)
      
      return NextResponse.json({ success: true, persistent: isRedisConfigured() })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 })
  }
}
