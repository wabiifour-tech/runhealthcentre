import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisConfigured, REDIS_KEYS } from '@/lib/redis'

// Default system users
const defaultUsers = [
  { id: '1', email: 'superadmin@run.edu.ng', name: 'System Administrator', role: 'SUPER_ADMIN', department: 'Administration', password: 'admin123', isFirstLogin: true, isActive: true, createdAt: '2024-01-01' },
  { id: '2', email: 'admin@run.edu.ng', name: 'Administrator', role: 'ADMIN', department: 'Administration', dateOfBirth: '1985-03-15', password: 'admin123', isFirstLogin: true, isActive: true, createdAt: '2024-01-01' },
  { id: '3', email: 'nurse@run.edu.ng', name: 'Staff Nurse', role: 'NURSE', department: 'Nursing', initials: 'SN', password: 'password123', isFirstLogin: false, isActive: true, createdAt: '2024-01-15' },
  { id: '4', email: 'doctor@run.edu.ng', name: 'Medical Doctor', role: 'DOCTOR', department: 'General', initials: 'MD', password: 'password123', isFirstLogin: false, isActive: true, createdAt: '2024-01-15' },
  { id: '5', email: 'pharmacist@run.edu.ng', name: 'Pharmacist', role: 'PHARMACIST', department: 'Pharmacy', initials: 'PH', password: 'password123', isFirstLogin: false, isActive: true, createdAt: '2024-01-15' },
  { id: '6', email: 'lab@run.edu.ng', name: 'Lab Technician', role: 'LAB_TECHNICIAN', department: 'Laboratory', initials: 'LT', password: 'password123', isFirstLogin: false, isActive: true, createdAt: '2024-01-15' },
  { id: '7', email: 'matron@run.edu.ng', name: 'Matron', role: 'MATRON', department: 'Nursing', initials: 'MT', password: 'password123', isFirstLogin: false, isActive: true, createdAt: '2024-01-15' },
]

// In-memory fallback storage (only used when Redis is not configured)
let memoryUsers: any[] = []

// Get users from storage
async function getUsers(): Promise<any[]> {
  if (isRedisConfigured()) {
    try {
      const users = await redis.get(REDIS_KEYS.USERS)
      if (users && Array.isArray(users)) {
        return users
      }
      // Initialize with default users if empty
      await redis.set(REDIS_KEYS.USERS, defaultUsers)
      return defaultUsers
    } catch (error) {
      console.error('Redis error:', error)
      return memoryUsers.length > 0 ? memoryUsers : defaultUsers
    }
  } else {
    // Fallback to memory if Redis not configured
    if (memoryUsers.length === 0) {
      memoryUsers = [...defaultUsers]
    }
    return memoryUsers
  }
}

// Save users to storage
async function saveUsers(users: any[]): Promise<void> {
  if (isRedisConfigured()) {
    try {
      await redis.set(REDIS_KEYS.USERS, users)
    } catch (error) {
      console.error('Redis save error:', error)
      memoryUsers = users
    }
  } else {
    memoryUsers = users
  }
}

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json({
      success: true,
      users,
      persistent: isRedisConfigured()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, users, user } = body

    let currentUsers = await getUsers()

    if (action === 'sync') {
      // Sync all users from client - merge with existing
      if (users && Array.isArray(users)) {
        // Create a map of existing users by ID
        const userMap = new Map(currentUsers.map((u: any) => [u.id, u]))
        
        // Add or update users from the incoming list
        for (const u of users) {
          userMap.set(u.id, u)
        }
        
        // Convert back to array and save
        const mergedUsers = Array.from(userMap.values())
        await saveUsers(mergedUsers)
        currentUsers = mergedUsers
      }
      return NextResponse.json({
        success: true,
        users: currentUsers,
        persistent: isRedisConfigured()
      })
    }

    if (action === 'add') {
      if (user) {
        const exists = currentUsers.find((u: any) => u.email === user.email)
        if (!exists) {
          const newUser = {
            ...user,
            id: user.id || `user_${Date.now()}`,
            createdAt: user.createdAt || new Date().toISOString(),
            isActive: user.isActive !== undefined ? user.isActive : true
          }
          currentUsers.push(newUser)
          await saveUsers(currentUsers)
          return NextResponse.json({
            success: true,
            user: newUser,
            users: currentUsers,
            persistent: isRedisConfigured()
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'User with this email already exists'
          }, { status: 400 })
        }
      }
    }

    if (action === 'update') {
      if (user && user.id) {
        currentUsers = currentUsers.map((u: any) => 
          u.id === user.id ? { ...u, ...user } : u
        )
        await saveUsers(currentUsers)
        return NextResponse.json({
          success: true,
          users: currentUsers,
          persistent: isRedisConfigured()
        })
      }
    }

    if (action === 'delete') {
      if (user && user.id) {
        currentUsers = currentUsers.filter((u: any) => u.id !== user.id)
        await saveUsers(currentUsers)
        return NextResponse.json({
          success: true,
          users: currentUsers,
          persistent: isRedisConfigured()
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
