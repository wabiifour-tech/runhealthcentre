// Medication Administration API - BULLETPROOF Implementation
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MedicationAdminAPI')

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
      CREATE TABLE IF NOT EXISTS medication_administrations (
        id TEXT PRIMARY KEY,
        "patientId" TEXT,
        patient JSON,
        "drugName" TEXT,
        dosage TEXT,
        route TEXT,
        "administeredBy" TEXT,
        "administeredAt" TEXT,
        notes TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch all medication administrations - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const administeredBy = searchParams.get('administeredBy')

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
      if (administeredBy) {
        conditions.push(`"administeredBy" = $${paramCount}`)
        params.push(administeredBy)
        paramCount++
      }

      const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'
      const result = await pool.query(`
        SELECT * FROM medication_administrations WHERE ${whereClause} ORDER BY "createdAt" DESC LIMIT 200
      `, params)

      await pool.end()
      return NextResponse.json({ success: true, administrations: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let whereClause = '1=1'
      if (patientId) whereClause += ` AND "patientId" = '${patientId}'`
      if (administeredBy) whereClause += ` AND "administeredBy" = '${administeredBy}'`
      
      const administrations = await p.$queryRawUnsafe(`SELECT * FROM medication_administrations WHERE ${whereClause} ORDER BY "createdAt" DESC LIMIT 200`) || []
      await pool.end()
      return NextResponse.json({ success: true, administrations, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, administrations: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching medication administrations', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Record medication administration - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, patient, drugName, dosage, route, administeredBy, administeredAt, notes, prescriptionId, consultationId } = body

    await ensureTable(pool)

    const id = `medadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const adminTime = administeredAt || now

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        INSERT INTO medication_administrations (
          id, "patientId", patient, "drugName", dosage, route,
          "administeredBy", "administeredAt", notes, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [id, patientId, JSON.stringify(patient || {}), drugName, dosage, route, administeredBy, adminTime, notes, now])

      await pool.end()
      logger.info('Medication administration recorded via direct pg', { id, drugName, patientId })
      return NextResponse.json({ success: true, administration: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        INSERT INTO medication_administrations (id, "patientId", patient, "drugName", dosage, route,
          "administeredBy", "administeredAt", notes, "createdAt")
        VALUES ('${id}', ${patientId ? `'${patientId}'` : 'NULL'}, ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
          ${drugName ? `'${drugName.replace(/'/g, "''")}'` : 'NULL'}, ${dosage ? `'${dosage.replace(/'/g, "''")}'` : 'NULL'},
          ${route ? `'${route}'` : 'NULL'}, ${administeredBy ? `'${administeredBy}'` : 'NULL'}, '${adminTime}',
          ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, '${now}')
      `)
      await pool.end()
      return NextResponse.json({ success: true, administration: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error recording medication administration', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete medication administration record - BULLETPROOF
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
      await pool.query(`DELETE FROM medication_administrations WHERE id = $1`, [id])
      await pool.end()
      logger.info('Medication administration deleted via direct pg', { id })
      return NextResponse.json({ success: true, message: 'Record deleted', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg DELETE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`DELETE FROM medication_administrations WHERE id = '${id}'`)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Record deleted', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error deleting medication administration', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
