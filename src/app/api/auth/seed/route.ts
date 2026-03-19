// Authentication API - Seed Default Users
// SECURITY: Requires SUPER_ADMIN authentication
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// Demo users info (for reference only - not exposed without auth)
const DEMO_CREDENTIALS = {
  superAdmin: { email: 'wabithetechnurse@ruhc', password: '#Abolaji7977' },
  admin: { email: 'admin@ruhc', password: 'admin123' },
  doctor: { email: 'doctor@ruhc', password: 'doctor123' },
  nurse: { email: 'nurse@ruhc', password: 'nurse123' },
  pharmacist: { email: 'pharmacist@ruhc', password: 'pharm123' },
  labTech: { email: 'labtech@ruhc', password: 'lab123' },
  records: { email: 'records@ruhc', password: 'records123' },
  matron: { email: 'matron@ruhc', password: 'matron123' }
}

// Bcrypt hash for SuperAdmin password "#Abolaji7977"
const SUPERADMIN_PASSWORD_HASH = '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC'
// Bcrypt hash for common password "admin123"
const ADMIN_PASSWORD_HASH = '$2b$12$NBxbO8I55rmeBxz0fnWOCOVQih4lSfBdCAp4oAvAP6yUAj7lW8jkW'
// Bcrypt hash for "doctor123"
const DOCTOR_PASSWORD_HASH = '$2b$12$Wkp4QWxmLpWFBIZhLNRNO.FdZ4eB8PQFvkZJrDxtXXMxQYXqHVqFq'

// Seed default admin users - REQUIRES SUPER_ADMIN AUTHENTICATION
export async function POST(request: NextRequest) {
  // SECURITY: Require SUPER_ADMIN authentication
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ 
      success: false, 
      error: auth.error || 'SUPER_ADMIN authentication required' 
    }, { status: auth.statusCode || 401 })
  }

  try {
    const prisma = await getPrisma()

    // If no database, return error (no demo mode for seeding)
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable. Cannot seed users.',
        mode: 'error'
      }, { status: 500 })
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
        password: DOCTOR_PASSWORD_HASH,
        viewablePassword: 'doctor123',
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
        viewablePassword: 'nurse123',
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
        viewablePassword: 'pharm123',
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
        viewablePassword: 'lab123',
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
        viewablePassword: 'records123',
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
        viewablePassword: 'matron123',
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
      createdBy: auth.user?.email
    })

  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Check if users exist - REQUIRES SUPER_ADMIN AUTHENTICATION
export async function GET(request: NextRequest) {
  // SECURITY: Require SUPER_ADMIN authentication
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ 
      success: false, 
      error: auth.error || 'SUPER_ADMIN authentication required' 
    }, { status: auth.statusCode || 401 })
  }

  try {
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable'
      }, { status: 500 })
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
      needsSeeding: userCount === 0,
      queriedBy: auth.user?.email
    })

  } catch (error: any) {
    console.error('Check users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 })
  }
}
