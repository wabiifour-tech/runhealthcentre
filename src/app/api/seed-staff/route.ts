// Emergency Staff Seeding API - Creates missing staff roles
// SECURITY: Requires SUPER_ADMIN authentication
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

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
    
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable. Cannot seed staff.'
      }, { status: 500 })
    }
    
    const p = prisma as any

    const now = new Date().toISOString()
    const passwordHash = '$2b$12$NBxbO8I55rmeBxz0fnWOCOVQih4lSfBdCAp4oAvAP6yUAj7lW8jkW' // "admin123"

    // Staff users to create
    const staffUsers = [
      {
        id: 'doctor-001',
        email: 'doctor@ruhc',
        name: 'Dr. Default Doctor',
        role: 'DOCTOR',
        department: 'General',
        initials: 'DD',
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
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
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
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
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
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
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
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
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
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
        password: passwordHash,
        viewablePassword: 'admin123',
        isActive: true,
        isFirstLogin: false,
        approvalStatus: 'APPROVED',
        createdAt: now
      }
    ]

    let created = 0
    let updated = 0
    const results: any[] = []

    for (const user of staffUsers) {
      try {
        // Check if user exists
        const existing = await p.users.findUnique({
          where: { email: user.email }
        })
        
        if (existing) {
          // Update existing user
          await p.users.update({
            where: { email: user.email },
            data: {
              password: user.password,
              viewablePassword: user.viewablePassword,
              isActive: true,
              approvalStatus: 'APPROVED',
              updatedAt: now
            }
          })
          updated++
          results.push({ email: user.email, action: 'updated' })
        } else {
          // Create new user
          await p.users.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              password: user.password,
              viewablePassword: user.viewablePassword,
              role: user.role,
              department: user.department,
              initials: user.initials,
              isActive: user.isActive,
              isFirstLogin: user.isFirstLogin,
              approvalStatus: user.approvalStatus,
              createdAt: now,
              updatedAt: now
            }
          })
          created++
          results.push({ email: user.email, action: 'created' })
        }
      } catch (e: any) {
        results.push({ email: user.email, action: 'error', error: e.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} new staff users, updated ${updated} existing users`,
      results,
      seededBy: auth.user?.email
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Require SUPER_ADMIN authentication
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ 
      success: false, 
      error: auth.error || 'SUPER_ADMIN authentication required' 
    }, { status: auth.statusCode || 401 })
  }

  return NextResponse.json({
    message: 'Staff seeding endpoint. Use POST to seed staff users.',
    note: 'SUPER_ADMIN authentication required',
    queriedBy: auth.user?.email
  })
}
