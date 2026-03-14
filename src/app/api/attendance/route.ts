// Attendance API - BULLETPROOF Database Operations
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// GET - Fetch attendance records - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')

    // Build WHERE clause
    const conditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (date) {
      conditions.push(`date = $${paramCount}`)
      values.push(date)
      paramCount++
    }
    if (staffId) {
      conditions.push(`"staffId" = $${paramCount}`)
      values.push(staffId)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // PRIMARY: Direct pg
    try {
      const result = await pool.query(`
        SELECT id, "staffId", "staffName", "staffRole", date, "signInTime", "signInPhoto",
               "signOutTime", "signOutPhoto", shift, status, "deviceId", notes,
               "createdAt"::text, "updatedAt"::text
        FROM attendance
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT 500
      `, values)

      await pool.end()
      return NextResponse.json({ success: true, records: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      console.warn('Direct pg failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const where: any = {}
      if (date) where.date = date
      if (staffId) where.staffId = staffId

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500
      })

      await pool.end()
      return NextResponse.json({ success: true, records, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, records: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance', details: error.message }, { status: 500 })
  }
}

// POST - Sign in attendance - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, staffId, staffName, staffRole, date, signInTime, signInPhoto, shift, status, deviceId, notes } = body

    // PRIMARY: Direct pg
    try {
      // Check if already signed in today
      const checkResult = await pool.query(`
        SELECT id FROM attendance WHERE "staffId" = $1 AND date = $2 AND "signInTime" IS NOT NULL
      `, [staffId, date])

      if (checkResult.rows.length > 0) {
        await pool.end()
        return NextResponse.json({ error: 'Already signed in today', record: checkResult.rows[0] }, { status: 400 })
      }

      const recordId = id || `att_${Date.now()}`
      await pool.query(`
        INSERT INTO attendance (id, "staffId", "staffName", "staffRole", date, "signInTime", "signInPhoto", shift, status, "deviceId", notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [recordId, staffId, staffName, staffRole, date, signInTime, signInPhoto, shift || 'morning', status || 'present', deviceId, notes, new Date(), new Date()])

      await pool.end()
      return NextResponse.json({ success: true, record: { id: recordId, staffId, staffName, staffRole, date, signInTime, signInPhoto, shift, status, deviceId, notes } })
    } catch (pgError: any) {
      console.warn('Direct pg POST failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const existing = await prisma.attendance.findFirst({
        where: { staffId, date, signInTime: { not: null } }
      })

      if (existing) {
        await pool.end()
        return NextResponse.json({ error: 'Already signed in today', record: existing }, { status: 400 })
      }

      const record = await prisma.attendance.create({
        data: {
          id: id || `att_${Date.now()}`,
          staffId, staffName, staffRole, date, signInTime, signInPhoto,
          shift: shift || 'morning',
          status: status || 'present',
          deviceId, notes
        }
      })

      await pool.end()
      return NextResponse.json({ success: true, record })
    }

    await pool.end()
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    console.error('Error signing in attendance:', error)
    return NextResponse.json({ error: 'Failed to sign in', details: error.message }, { status: 500 })
  }
}

// PUT - Sign out attendance - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, signOutTime, signOutPhoto, notes } = body

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        UPDATE attendance SET "signOutTime" = $1, "signOutPhoto" = $2, notes = $3, "updatedAt" = $4
        WHERE id = $5
      `, [signOutTime, signOutPhoto, notes, new Date(), id])

      const result = await pool.query(`SELECT * FROM attendance WHERE id = $1`, [id])
      await pool.end()
      return NextResponse.json({ success: true, record: result.rows[0] })
    } catch (pgError: any) {
      console.warn('Direct pg PUT failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const record = await prisma.attendance.update({
        where: { id },
        data: { signOutTime, signOutPhoto, notes }
      })
      await pool.end()
      return NextResponse.json({ success: true, record })
    }

    await pool.end()
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    console.error('Error signing out attendance:', error)
    return NextResponse.json({ error: 'Failed to sign out', details: error.message }, { status: 500 })
  }
}
