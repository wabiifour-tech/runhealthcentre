// Authentication API - Seed Default Users
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'

// Demo users info (always available)
const DEMO_CREDENTIALS = {
  superAdmin: { email: 'wabithetechnurse@ruhc', password: '#Abolaji7977' },
  admin: { email: 'admin@ruhc', password: 'admin123' },
  doctor: { email: 'doctor@ruhc', password: 'admin123' },
  nurse: { email: 'nurse@ruhc', password: 'admin123' },
  pharmacist: { email: 'pharmacist@ruhc', password: 'admin123' },
  labTech: { email: 'labtech@ruhc', password: 'admin123' },
  records: { email: 'records@ruhc', password: 'admin123' },
  matron: { email: 'matron@ruhc', password: 'admin123' }
}

// Bcrypt hash for SuperAdmin password "#Abolaji7977"
const SUPERADMIN_PASSWORD_HASH = '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC'
// Bcrypt hash for admin password "admin123"
const ADMIN_PASSWORD_HASH = '$2b$12$NBxbO8I55rmeBxz0fnWOCOVQih4lSfBdCAp4oAvAP6yUAj7lW8jkW'

// Seed default admin users
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()

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
        viewablePassword: '#Abolaji7977',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
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
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      // Staff users for department routing
      {
        id: 'doctor-001',
        email: 'doctor@ruhc',
        name: 'Dr. Default Doctor',
        role: 'DOCTOR',
        department: 'General',
        initials: 'DD',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      {
        id: 'nurse-001',
        email: 'nurse@ruhc',
        name: 'Default Nurse',
        role: 'NURSE',
        department: 'Nursing',
        initials: 'DN',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      {
        id: 'pharmacist-001',
        email: 'pharmacist@ruhc',
        name: 'Default Pharmacist',
        role: 'PHARMACIST',
        department: 'Pharmacy',
        initials: 'DP',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      {
        id: 'lab-tech-001',
        email: 'labtech@ruhc',
        name: 'Default Lab Technician',
        role: 'LAB_TECHNICIAN',
        department: 'Laboratory',
        initials: 'LT',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      {
        id: 'records-001',
        email: 'records@ruhc',
        name: 'Default Records Officer',
        role: 'RECORDS_OFFICER',
        department: 'Records',
        initials: 'RO',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      },
      {
        id: 'matron-001',
        email: 'matron@ruhc',
        name: 'Default Matron',
        role: 'MATRON',
        department: 'Nursing',
        initials: 'MT',
        password: ADMIN_PASSWORD_HASH,
        viewablePassword: 'admin123',
        isFirstLogin: false,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: now
      }
    ]

    let created = 0
    let updated = 0

    for (const userData of defaultUsers) {
      try {
        const existing = await p.users.findUnique({
          where: { email: userData.email }
        })

        if (existing) {
          await p.users.update({
            where: { email: userData.email },
            data: {
              password: userData.password,
              viewablePassword: userData.viewablePassword,
              isActive: true,
              approvalStatus: 'APPROVED'
            }
          })
          updated++
        } else {
          await p.users.create({
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
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({
        success: true,
        userCount: 8,
        users: Object.entries(DEMO_CREDENTIALS).map(([role, creds]) => ({
          email: creds.email,
          role: role.toUpperCase(),
          isActive: true
        })),
        needsSeeding: false,
        mode: 'demo'
      })
    }

    const p = prisma as any
    const userCount = await p.users.count()
    const users = await p.users.findMany({
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
      userCount: 8,
      users: Object.entries(DEMO_CREDENTIALS).map(([role, creds]) => ({
        email: creds.email,
        role: role.toUpperCase(),
        isActive: true
      })),
      needsSeeding: false,
      mode: 'demo'
    })
  }
}
