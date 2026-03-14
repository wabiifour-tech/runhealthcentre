// Immunization Records API - BULLETPROOF Implementation
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ImmunizationAPI')

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
      CREATE TABLE IF NOT EXISTS immunization_records (
        id TEXT PRIMARY KEY,
        "patientId" TEXT,
        patient JSON,
        "vaccineName" TEXT,
        "doseNumber" INTEGER,
        "batchNumber" TEXT,
        "administeredBy" TEXT,
        "administeredAt" TEXT,
        "nextDoseDate" TEXT,
        reactions TEXT,
        notes TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch immunization records - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const vaccineName = searchParams.get('vaccineName')

    await ensureTable(pool)

    // PRIMARY: Direct pg
    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramCount = 1

      if (patientId) {
        conditions.push(`"patientId" = $${paramCount}`)
        params.push(patientId)
        paramCount++
      }
      if (vaccineName) {
        conditions.push(`"vaccineName" ILIKE $${paramCount}`)
        params.push(`%${vaccineName}%`)
        paramCount++
      }

      const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'
      const result = await pool.query(`
        SELECT * FROM immunization_records WHERE ${whereClause} ORDER BY "administeredAt" DESC LIMIT 200
      `, params)

      await pool.end()
      return NextResponse.json({ success: true, records: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let whereClause = '1=1'
      if (patientId) whereClause += ` AND "patientId" = '${patientId}'`
      if (vaccineName) whereClause += ` AND "vaccineName" ILIKE '%${vaccineName}%'`
      
      const records = await p.$queryRawUnsafe(`SELECT * FROM immunization_records WHERE ${whereClause} ORDER BY "administeredAt" DESC LIMIT 200`) || []
      await pool.end()
      return NextResponse.json({ success: true, records, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, records: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching immunization records', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new immunization record - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, patient, vaccineName, doseNumber, batchNumber, administeredBy, administeredAt, nextDoseDate, reactions, notes } = body

    await ensureTable(pool)

    const id = `imm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const adminTime = administeredAt || now

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        INSERT INTO immunization_records (
          id, "patientId", patient, "vaccineName", "doseNumber", "batchNumber",
          "administeredBy", "administeredAt", "nextDoseDate", reactions, notes, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [id, patientId, JSON.stringify(patient || {}), vaccineName, doseNumber, batchNumber, administeredBy, adminTime, nextDoseDate, reactions, notes, now])

      await pool.end()
      logger.info('Immunization record created via direct pg', { id, vaccineName, patientId })

      // Create task reminder if next dose date exists (non-blocking)
      if (nextDoseDate) {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patient-tasks`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId, patient, taskId: 'vaccination_reminder',
            taskName: `${vaccineName} Dose ${(doseNumber || 0) + 1} Reminder`,
            scheduledTime: nextDoseDate, priority: 'routine',
            notes: `Follow-up vaccination for ${vaccineName}`, assignedBy: administeredBy
          })
        }).catch(() => {})
      }

      return NextResponse.json({ success: true, record: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        INSERT INTO immunization_records (id, "patientId", patient, "vaccineName", "doseNumber", "batchNumber",
          "administeredBy", "administeredAt", "nextDoseDate", reactions, notes, "createdAt")
        VALUES ('${id}', ${patientId ? `'${patientId}'` : 'NULL'}, ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
          ${vaccineName ? `'${vaccineName.replace(/'/g, "''")}'` : 'NULL'}, ${doseNumber || 'NULL'}, ${batchNumber ? `'${batchNumber}'` : 'NULL'},
          ${administeredBy ? `'${administeredBy}'` : 'NULL'}, '${adminTime}', ${nextDoseDate ? `'${nextDoseDate}'` : 'NULL'},
          ${reactions ? `'${reactions.replace(/'/g, "''")}'` : 'NULL'}, ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, '${now}')
      `)
      await pool.end()
      return NextResponse.json({ success: true, record: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete immunization record - BULLETPROOF
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    // PRIMARY: Direct pg
    try {
      await pool.query(`DELETE FROM immunization_records WHERE id = $1`, [id])
      await pool.end()
      logger.info('Immunization record deleted via direct pg', { id })
      return NextResponse.json({ success: true, message: 'Record deleted', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg DELETE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`DELETE FROM immunization_records WHERE id = '${id}'`)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Record deleted', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error deleting immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
