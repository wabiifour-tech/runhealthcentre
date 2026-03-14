// Debug endpoint to check user status - only accessible by SUPER_ADMIN
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { authenticateRequest } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

export async function GET(request: NextRequest) {
  // Verify SuperAdmin access
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const userId = searchParams.get('userId')

  const pool = getPool()

  try {
    let result

    if (email) {
      // Search by email
      result = await pool.query(`
        SELECT id, email, name, role, department, initials,
               "isActive", "isFirstLogin", "approvalStatus",
               "viewablePassword", "createdAt"::text, "approvedAt"::text,
               "lastLogin"::text
        FROM users
        WHERE email ILIKE $1
      `, [`%${email}%`])
    } else if (userId) {
      // Search by ID
      result = await pool.query(`
        SELECT id, email, name, role, department, initials,
               "isActive", "isFirstLogin", "approvalStatus",
               "viewablePassword", "createdAt"::text, "approvedAt"::text,
               "lastLogin"::text
        FROM users
        WHERE id = $1
      `, [userId])
    } else {
      // Return all users summary
      result = await pool.query(`
        SELECT id, email, name, role, "isActive", "approvalStatus", "createdAt"::text
        FROM users
        ORDER BY "createdAt" DESC
        LIMIT 50
      `)
    }

    await pool.end()

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    })

  } catch (error: any) {
    await pool.end()
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create or fix user (SuperAdmin only)
export async function POST(request: NextRequest) {
  // Verify SuperAdmin access
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 })
  }

  const body = await request.json()
  const { email, password, name, role, department, forceUpdate } = body

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const pool = getPool()

  try {
    // Check if user exists
    const existing = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email.toLowerCase()])

    if (existing.rows.length > 0 && !forceUpdate) {
      await pool.end()
      return NextResponse.json({
        success: false,
        message: 'User already exists',
        user: existing.rows[0],
        hint: 'Use forceUpdate=true in request body to update password'
      })
    }

    if (existing.rows.length > 0 && forceUpdate) {
      // Update existing user password
      const hashedPassword = await bcrypt.hash(password, 12)
      await pool.query(`
        UPDATE users
        SET password = $1, "viewablePassword" = $2, "isActive" = true,
            "approvalStatus" = 'APPROVED', "updatedAt" = NOW()
        WHERE email = $3
      `, [hashedPassword, password, email.toLowerCase()])

      await pool.end()
      return NextResponse.json({
        success: true,
        message: 'User password updated and account activated',
        email: email.toLowerCase()
      })
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await bcrypt.hash(password, 12)

    await pool.query(`
      INSERT INTO users (
        id, email, name, password, "viewablePassword", role, department,
        initials, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, 'APPROVED', NOW(), NOW())
    `, [
      userId,
      email.toLowerCase(),
      name || email.split('@')[0],
      hashedPassword,
      password,
      role || 'NURSE',
      department || 'General',
      (name || email).substring(0, 2).toUpperCase()
    ])

    await pool.end()
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId,
      email: email.toLowerCase()
    })

  } catch (error: any) {
    await pool.end()
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
