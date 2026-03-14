// Insurance Claims API - BULLETPROOF Implementation
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('InsuranceClaimsAPI')

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
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id TEXT PRIMARY KEY,
        "patientId" TEXT,
        patient JSON,
        "enrolleeId" TEXT,
        "hmoId" TEXT,
        "claimType" TEXT,
        services JSON,
        "totalAmount" REAL,
        "approvedAmount" REAL,
        diagnosis TEXT,
        "icdCode" TEXT,
        status TEXT DEFAULT 'draft',
        "submittedAt" TEXT,
        "processedAt" TEXT,
        "processedBy" TEXT,
        "rejectionReason" TEXT,
        notes TEXT,
        "createdBy" TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch all insurance claims - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    await ensureTable(pool)

    // PRIMARY: Direct pg
    try {
      let query = `SELECT * FROM insurance_claims ORDER BY "createdAt" DESC LIMIT 100`
      const params: any[] = []
      
      if (status) {
        query = `SELECT * FROM insurance_claims WHERE status = $1 ORDER BY "createdAt" DESC LIMIT 100`
        params.push(status)
      }

      const result = await pool.query(query, params)
      await pool.end()
      return NextResponse.json({ success: true, claims: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let whereClause = '1=1'
      if (status) whereClause = `status = '${status}'`
      const claims = await p.$queryRawUnsafe(`SELECT * FROM insurance_claims WHERE ${whereClause} ORDER BY "createdAt" DESC LIMIT 100`)
      await pool.end()
      return NextResponse.json({ success: true, claims: claims || [], method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, claims: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching insurance claims', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new insurance claim - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, patient, enrolleeId, hmoId, claimType, services, totalAmount, diagnosis, icdCode, notes, createdBy } = body

    await ensureTable(pool)

    const id = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        INSERT INTO insurance_claims (
          id, "patientId", patient, "enrolleeId", "hmoId", "claimType", services,
          "totalAmount", diagnosis, "icdCode", notes, "createdBy", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13, $14)
      `, [id, patientId, JSON.stringify(patient || {}), enrolleeId, hmoId, claimType, JSON.stringify(services || []),
          totalAmount, diagnosis, icdCode, notes, createdBy, now, now])

      await pool.end()
      logger.info('Insurance claim created via direct pg', { id })

      // Create notification (non-blocking)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insurance_claim', title: 'New Insurance Claim',
          message: `New insurance claim created for ${patient?.name || 'patient'}`,
          targetRoles: ['ADMIN', 'SUPER_ADMIN'], priority: 'normal', data: { claimId: id, patientId }
        })
      }).catch(() => {})

      return NextResponse.json({ success: true, claim: { id, ...body, status: 'draft', createdAt: now }, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        INSERT INTO insurance_claims (id, "patientId", patient, "enrolleeId", "hmoId", "claimType", services, 
          "totalAmount", diagnosis, "icdCode", notes, "createdBy", status, "createdAt", "updatedAt")
        VALUES ('${id}', ${patientId ? `'${patientId}'` : 'NULL'}, ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
          ${enrolleeId ? `'${enrolleeId}'` : 'NULL'}, ${hmoId ? `'${hmoId}'` : 'NULL'}, ${claimType ? `'${claimType}'` : 'NULL'},
          ${services ? `'${JSON.stringify(services).replace(/'/g, "''")}'` : 'NULL'}, ${totalAmount || 'NULL'},
          ${diagnosis ? `'${diagnosis.replace(/'/g, "''")}'` : 'NULL'}, ${icdCode ? `'${icdCode}'` : 'NULL'},
          ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, ${createdBy ? `'${createdBy}'` : 'NULL'}, 'draft', '${now}', '${now}')
      `)

      await pool.end()
      return NextResponse.json({ success: true, claim: { id, ...body, status: 'draft', createdAt: now }, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating insurance claim', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update insurance claim status - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, status, approvedAmount, rejectionReason, processedBy, notes } = body

    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Claim ID required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        UPDATE insurance_claims SET
          status = COALESCE($1, status),
          "approvedAmount" = COALESCE($2, "approvedAmount"),
          "rejectionReason" = COALESCE($3, "rejectionReason"),
          "processedBy" = COALESCE($4, "processedBy"),
          "processedAt" = CASE WHEN $1 IN ('approved', 'rejected') THEN $5 ELSE "processedAt" END,
          notes = COALESCE($6, notes),
          "updatedAt" = $5
        WHERE id = $7
      `, [status, approvedAmount, rejectionReason, processedBy, now, notes, id])

      await pool.end()
      logger.info('Insurance claim updated via direct pg', { id, status })
      return NextResponse.json({ success: true, message: 'Claim updated successfully', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg PUT failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        UPDATE insurance_claims SET status = ${status ? `'${status}'` : 'status'},
          "approvedAmount" = ${approvedAmount || 'NULL'}, "rejectionReason" = ${rejectionReason ? `'${rejectionReason.replace(/'/g, "''")}'` : 'NULL'},
          "processedBy" = ${processedBy ? `'${processedBy}'` : 'NULL'},
          "processedAt" = ${status === 'approved' || status === 'rejected' ? `'${now}'` : 'NULL'},
          notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'}, "updatedAt" = '${now}'
        WHERE id = '${id}'
      `)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Claim updated successfully', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating insurance claim', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
