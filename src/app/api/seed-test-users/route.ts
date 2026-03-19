// Seed Test Users with password Test@123
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { PrismaClient } from '@/generated/prisma'

const TEST_PASSWORD = 'Test@123'

async function getTestUsers() {
  const TEST_PASSWORD_HASH = await bcrypt.hash(TEST_PASSWORD, 12)
  
  return [
    {
      id: 'superadmin-test-001',
      email: 'superadmin@ruhc',
      name: 'Super Admin Test',
      role: 'SUPER_ADMIN',
      department: 'Administration',
      initials: 'SA',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'admin-test-001',
      email: 'admin@ruhc',
      name: 'Admin Test',
      role: 'ADMIN',
      department: 'Administration',
      initials: 'AD',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'doctor-test-001',
      email: 'doctor@ruhc',
      name: 'Dr. Test Doctor',
      role: 'DOCTOR',
      department: 'General',
      initials: 'DD',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'nurse-test-001',
      email: 'nurse@ruhc',
      name: 'Test Nurse',
      role: 'NURSE',
      department: 'Nursing',
      initials: 'TN',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'pharmacist-test-001',
      email: 'pharmacist@ruhc',
      name: 'Test Pharmacist',
      role: 'PHARMACIST',
      department: 'Pharmacy',
      initials: 'TP',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'labtech-test-001',
      email: 'labtech@ruhc',
      name: 'Test Lab Technician',
      role: 'LAB_TECHNICIAN',
      department: 'Laboratory',
      initials: 'LT',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'matron-test-001',
      email: 'matron@ruhc',
      name: 'Test Matron',
      role: 'MATRON',
      department: 'Nursing',
      initials: 'MT',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    },
    {
      id: 'records-test-001',
      email: 'records@ruhc',
      name: 'Test Records Officer',
      role: 'RECORDS_OFFICER',
      department: 'Records',
      initials: 'RO',
      password: TEST_PASSWORD_HASH,
      viewablePassword: TEST_PASSWORD,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED'
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    // Simple API key check
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== 'ruhc-seed-test-2024') {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 403 })
    }

    // Create direct LibSQL client
    const { createClient } = await import('@libsql/client')
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    
    const dbPath = process.cwd() + '/db/custom.db'
    console.log('[Seed] Database path:', dbPath)
    
    const libsql = createClient({
      url: `file:${dbPath}`
    })
    
    const adapter = new PrismaLibSQL(libsql)
    const prisma = new PrismaClient({ adapter })

    const testUsers = await getTestUsers()
    let created = 0
    let updated = 0
    const results: any[] = []

    for (const userData of testUsers) {
      try {
        const existing = await prisma.users.findUnique({
          where: { email: userData.email }
        })

        if (existing) {
          await prisma.users.update({
            where: { email: userData.email },
            data: {
              password: userData.password,
              viewablePassword: userData.viewablePassword,
              isActive: true,
              approvalStatus: 'APPROVED',
              isFirstLogin: false
            }
          })
          updated++
          results.push({ email: userData.email, action: 'updated' })
        } else {
          await prisma.users.create({
            data: userData
          })
          created++
          results.push({ email: userData.email, action: 'created' })
        }
      } catch (e: any) {
        results.push({ email: userData.email, action: 'error', error: e.message })
      }
    }

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: `Created ${created} new users, updated ${updated} existing users`,
      results,
      credentials: {
        password: TEST_PASSWORD,
        users: testUsers.map(u => ({ email: u.email, role: u.role }))
      }
    })

  } catch (error: any) {
    console.error('[Seed] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  const testUsers = await getTestUsers()
  return NextResponse.json({
    message: 'Test users seeding endpoint. Use POST with x-api-key header.',
    requiredHeader: 'x-api-key: ruhc-seed-test-2024',
    password: TEST_PASSWORD,
    users: testUsers.map(u => ({ email: u.email, role: u.role }))
  })
}
