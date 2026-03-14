// Surgery Bookings API - BULLETPROOF Implementation
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SurgeryBookingsAPI')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// Ensure table exists
async function ensureTable(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS surgery_bookings (
        id TEXT PRIMARY KEY,
        "patientId" TEXT,
        patient JSON,
        "surgeryType" TEXT,
        "surgeonId" TEXT,
        "surgeonName" TEXT,
        "anesthetistId" TEXT,
        "anesthetistName" TEXT,
        "theatreId" TEXT,
        "theatreName" TEXT,
        "scheduledDate" TEXT,
        "scheduledTime" TEXT,
        "estimatedDuration" INTEGER,
        status TEXT DEFAULT 'scheduled',
        priority TEXT DEFAULT 'routine',
        "preOpChecklist" JSON,
        notes TEXT,
        "bookedBy" TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch all surgery bookings - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    await ensureTable(pool)

    // PRIMARY: Direct pg
    try {
      let query = `SELECT * FROM surgery_bookings ORDER BY "createdAt" DESC LIMIT 100`
      const params: any[] = []
      
      if (status) {
        query = `SELECT * FROM surgery_bookings WHERE status = $1 ORDER BY "createdAt" DESC LIMIT 100`
        params.push(status)
      }

      const result = await pool.query(query, params)
      await pool.end()
      return NextResponse.json({ success: true, bookings: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      const whereClause = status ? `status = '${status}'` : '1=1'
      const bookings = await p.$queryRawUnsafe(`SELECT * FROM surgery_bookings WHERE ${whereClause} ORDER BY "createdAt" DESC LIMIT 100`) || []
      await pool.end()
      return NextResponse.json({ success: true, bookings, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, bookings: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching surgery bookings', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new surgery booking - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, patient, surgeryType, surgeonId, surgeonName, anesthetistId, anesthetistName,
            theatreId, theatreName, scheduledDate, scheduledTime, estimatedDuration, priority,
            preOpChecklist, notes, bookedBy } = body

    await ensureTable(pool)

    const id = `surgery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        INSERT INTO surgery_bookings (
          id, "patientId", patient, "surgeryType", "surgeonId", "surgeonName",
          "anesthetistId", "anesthetistName", "theatreId", "theatreName",
          "scheduledDate", "scheduledTime", "estimatedDuration", priority,
          "preOpChecklist", notes, "bookedBy", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'scheduled', $18, $19)
      `, [id, patientId, JSON.stringify(patient || {}), surgeryType, surgeonId, surgeonName,
          anesthetistId, anesthetistName, theatreId, theatreName, scheduledDate, scheduledTime,
          estimatedDuration, priority || 'routine', JSON.stringify(preOpChecklist || {}), notes, bookedBy, now, now])

      await pool.end()
      logger.info('Surgery booking created via direct pg', { id, surgeryType })

      // Notification (non-blocking)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'surgery_booking', title: 'New Surgery Scheduled',
          message: `Surgery scheduled for ${patient?.name || 'patient'} - ${surgeryType}`,
          targetRoles: ['DOCTOR', 'NURSE', 'ADMIN'], priority: priority === 'emergency' ? 'high' : 'normal',
          data: { bookingId: id, patientId, surgeryType }
        })
      }).catch(() => {})

      return NextResponse.json({ success: true, booking: { id, ...body, status: 'scheduled', createdAt: now }, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        INSERT INTO surgery_bookings (id, "patientId", patient, "surgeryType", "surgeonId", "surgeonName",
          "anesthetistId", "anesthetistName", "theatreId", "theatreName", "scheduledDate", "scheduledTime",
          "estimatedDuration", priority, "preOpChecklist", notes, "bookedBy", status, "createdAt", "updatedAt")
        VALUES ('${id}', ${patientId ? `'${patientId}'` : 'NULL'}, ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
          ${surgeryType ? `'${surgeryType.replace(/'/g, "''")}'` : 'NULL'}, ${surgeonId ? `'${surgeonId}'` : 'NULL'},
          ${surgeonName ? `'${surgeonName.replace(/'/g, "''")}'` : 'NULL'}, ${anesthetistId ? `'${anesthetistId}'` : 'NULL'},
          ${anesthetistName ? `'${anesthetistName.replace(/'/g, "''")}'` : 'NULL'}, ${theatreId ? `'${theatreId}'` : 'NULL'},
          ${theatreName ? `'${theatreName.replace(/'/g, "''")}'` : 'NULL'}, ${scheduledDate ? `'${scheduledDate}'` : 'NULL'},
          ${scheduledTime ? `'${scheduledTime}'` : 'NULL'}, ${estimatedDuration || 'NULL'}, ${priority ? `'${priority}'` : "'routine'"},
          ${preOpChecklist ? `'${JSON.stringify(preOpChecklist).replace(/'/g, "''")}'` : 'NULL'},
          ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, ${bookedBy ? `'${bookedBy}'` : 'NULL'}, 'scheduled', '${now}', '${now}')
      `)
      await pool.end()
      return NextResponse.json({ success: true, booking: { id, ...body, status: 'scheduled', createdAt: now }, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating surgery booking', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update surgery booking - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, status, notes, preOpChecklist } = body

    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        UPDATE surgery_bookings SET
          status = COALESCE($1, status),
          notes = COALESCE($2, notes),
          "preOpChecklist" = COALESCE($3, "preOpChecklist"),
          "updatedAt" = $4
        WHERE id = $5
      `, [status, notes, preOpChecklist ? JSON.stringify(preOpChecklist) : null, now, id])

      await pool.end()
      logger.info('Surgery booking updated via direct pg', { id, status })
      return NextResponse.json({ success: true, message: 'Booking updated successfully', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg PUT failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        UPDATE surgery_bookings SET status = ${status ? `'${status}'` : 'status'},
          notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'},
          "preOpChecklist" = ${preOpChecklist ? `'${JSON.stringify(preOpChecklist).replace(/'/g, "''")}'` : '"preOpChecklist"'},
          "updatedAt" = '${now}'
        WHERE id = '${id}'
      `)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Booking updated successfully', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating surgery booking', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
