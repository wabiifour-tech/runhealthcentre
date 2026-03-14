// Emergency Staff Seeding API - Creates missing staff roles
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  })
}

export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    // Simple API key check for security
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== 'ruhc-seed-staff-2024') {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 403 })
    }

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
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email])
        
        if (existing.rows.length > 0) {
          // Update existing user
          await pool.query(`
            UPDATE users SET 
              password = $1, 
              "viewablePassword" = $2,
              "isActive" = true, 
              "approvalStatus" = 'APPROVED',
              "updatedAt" = $3
            WHERE email = $4
          `, [user.password, user.viewablePassword, now, user.email])
          updated++
          results.push({ email: user.email, action: 'updated' })
        } else {
          // Create new user
          await pool.query(`
            INSERT INTO users (
              id, email, name, password, "viewablePassword", role, department, 
              initials, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
          `, [
            user.id, user.email, user.name, user.password, user.viewablePassword,
            user.role, user.department, user.initials, user.isActive, user.isFirstLogin,
            user.approvalStatus, now
          ])
          created++
          results.push({ email: user.email, action: 'created' })
        }
      } catch (e: any) {
        results.push({ email: user.email, action: 'error', error: e.message })
      }
    }

    await pool.end()

    return NextResponse.json({
      success: true,
      message: `Created ${created} new staff users, updated ${updated} existing users`,
      results,
      credentials: {
        password: 'admin123',
        users: staffUsers.map(u => ({ email: u.email, role: u.role }))
      }
    })

  } catch (error: any) {
    await pool.end().catch(() => {})
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Staff seeding endpoint. Use POST with x-api-key header.',
    requiredHeader: 'x-api-key: ruhc-seed-staff-2024'
  })
}
