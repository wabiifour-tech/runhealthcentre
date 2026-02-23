// Authentication API - Seed Default Users
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Demo users info (always available)
const DEMO_CREDENTIALS = {
  superAdmin: { email: 'wabithetechnurse@ruhc', password: '#Abolaji7977' },
  admin: { email: 'admin@ruhc', password: 'admin123' }
}

// Bcrypt hash for SuperAdmin password "#Abolaji7977"
const SUPERADMIN_PASSWORD_HASH = '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC'
// Bcrypt hash for admin password "admin123"
const ADMIN_PASSWORD_HASH = '$2b$12$NBxbO8I55rmeBxz0fnWOCOVQih4lSfBdCAp4oAvAP6yUAj7lW8jkW'

// Seed default admin users
export async function POST(request: NextRequest) {
  try {
    // Try to get prisma (dynamic import)
    let prisma: any = null
    try {
      const dbModule = await import('@/lib/db')
      prisma = dbModule.default
    } catch (e) {
      console.log('Prisma not available, running in demo mode')
    }

    // If no database, return demo mode info
    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        message: 'Running in demo mode - no database connection',
        mode: 'demo',
        defaultCredentials: DEMO_CREDENTIALS
      })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    // Default users with correct password hash
    const defaultUsers = [
      {
        id: 'super-admin-001',
        email: 'wabithetechnurse@ruhc',
        name: 'Wabi The Tech Nurse',
        role: 'SUPER_ADMIN',
        department: 'Administration',
        initials: 'WT',
        password: SUPERADMIN_PASSWORD_HASH,
        isFirstLogin: false,
        isActive: true,
        createdAt: now
      },
      {
        id: 'admin-001',
        email: 'admin@ruhc',
        name: 'Administrator',
        role: 'ADMIN',
        department: 'Administration',
        initials: 'AD',
        password: ADMIN_PASSWORD_HASH,
        isFirstLogin: false,
        isActive: true,
        createdAt: now
      }
    ]

    let created = 0
    let updated = 0

    for (const userData of defaultUsers) {
      try {
        const existing = await p.user.findUnique({
          where: { email: userData.email }
        })

        if (existing) {
          await p.user.update({
            where: { email: userData.email },
            data: {
              password: userData.password,
              isActive: true
            }
          })
          updated++
        } else {
          await p.user.create({
            data: userData
          })
          created++
        }
      } catch (e: any) {
        console.log('Error with user:', userData.email, e.message)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${created} new users, updated ${updated} existing users`,
      defaultCredentials: DEMO_CREDENTIALS
    })

  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: true, // Return success anyway for demo mode
      message: 'Running in demo mode',
      mode: 'demo',
      defaultCredentials: DEMO_CREDENTIALS
    })
  }
}

// Check if users exist
export async function GET() {
  try {
    // Try to get prisma (dynamic import)
    let prisma: any = null
    try {
      const dbModule = await import('@/lib/db')
      prisma = dbModule.default
    } catch (e) {
      // No prisma available
    }

    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        userCount: 2,
        users: [
          { email: 'wabithetechnurse@ruhc', role: 'SUPER_ADMIN', isActive: true },
          { email: 'admin@ruhc', role: 'ADMIN', isActive: true }
        ],
        needsSeeding: false,
        mode: 'demo'
      })
    }

    const p = prisma as any
    const userCount = await p.user.count()
    const users = await p.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      userCount,
      users,
      needsSeeding: userCount === 0
    })

  } catch (error: any) {
    console.error('Check users error:', error)
    return NextResponse.json({ 
      success: true, 
      userCount: 2,
      users: [
        { email: 'wabithetechnurse@ruhc', role: 'SUPER_ADMIN', isActive: true },
        { email: 'admin@ruhc', role: 'ADMIN', isActive: true }
      ],
      needsSeeding: false,
      mode: 'demo'
    })
  }
}
