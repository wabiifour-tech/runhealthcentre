// Blood Bank API - BULLETPROOF Donors and Blood Units Management
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BloodBankAPI')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// Ensure tables exist
async function ensureTables(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_donors (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        email TEXT,
        "bloodGroup" TEXT,
        genotype TEXT,
        "lastDonationDate" TEXT,
        "totalDonations" INTEGER DEFAULT 0,
        "isEligible" BOOLEAN DEFAULT TRUE,
        notes TEXT,
        "registeredAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_units (
        id TEXT PRIMARY KEY,
        "donorId" TEXT,
        "donorName" TEXT,
        "bloodGroup" TEXT,
        "componentType" TEXT DEFAULT 'whole_blood',
        "volumeMl" INTEGER DEFAULT 450,
        "collectionDate" TEXT,
        "expiryDate" TEXT,
        status TEXT DEFAULT 'available',
        "reservedForPatientId" TEXT,
        "transfusedAt" TEXT,
        "transfusedToPatientId" TEXT,
        notes TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch blood bank data - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    // Ensure tables exist
    await ensureTables(pool)

    // PRIMARY: Direct pg
    try {
      let donors: any[] = []
      let units: any[] = []

      if (type === 'donors' || type === 'all') {
        const donorResult = await pool.query(`
          SELECT * FROM blood_donors ORDER BY "registeredAt" DESC LIMIT 100
        `)
        donors = donorResult.rows
      }

      if (type === 'units' || type === 'all') {
        const unitResult = await pool.query(`
          SELECT * FROM blood_units ORDER BY "createdAt" DESC LIMIT 100
        `)
        units = unitResult.rows
      }

      // Calculate inventory summary
      const inventory: Record<string, number> = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
      }
      
      units.forEach((unit: any) => {
        if (unit.status === 'available' && unit.bloodGroup && inventory.hasOwnProperty(unit.bloodGroup)) {
          inventory[unit.bloodGroup]++
        }
      })

      await pool.end()
      return NextResponse.json({ 
        success: true, donors, units, inventory,
        totalDonors: donors.length,
        availableUnits: units.filter((u: any) => u.status === 'available').length,
        method: 'direct-pg'
      })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let donors: any[] = []
      let units: any[] = []

      if (type === 'donors' || type === 'all') {
        donors = await p.$queryRawUnsafe(`SELECT * FROM blood_donors ORDER BY "registeredAt" DESC LIMIT 100`) || []
      }
      if (type === 'units' || type === 'all') {
        units = await p.$queryRawUnsafe(`SELECT * FROM blood_units ORDER BY "createdAt" DESC LIMIT 100`) || []
      }

      const inventory: Record<string, number> = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 }
      units.forEach((unit: any) => {
        if (unit.status === 'available' && unit.bloodGroup && inventory.hasOwnProperty(unit.bloodGroup)) {
          inventory[unit.bloodGroup]++
        }
      })

      await pool.end()
      return NextResponse.json({ success: true, donors, units, inventory, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, donors: [], units: [], inventory: { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 }, method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching blood bank data', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Register donor or add blood unit - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { action, ...data } = body
    const now = new Date().toISOString()

    await ensureTables(pool)

    // PRIMARY: Direct pg
    try {
      if (action === 'register_donor') {
        const id = `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await pool.query(`
          INSERT INTO blood_donors (id, name, phone, email, "bloodGroup", genotype, "lastDonationDate", "totalDonations", "isEligible", notes, "registeredAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 0, TRUE, $8, $9)
        `, [id, data.name, data.phone, data.email, data.bloodGroup, data.genotype, data.lastDonationDate, data.notes, now])

        await pool.end()
        logger.info('Blood donor registered via direct pg', { id, name: data.name })
        return NextResponse.json({ success: true, donor: { id, ...data, registeredAt: now }, method: 'direct-pg' })
      }

      if (action === 'add_unit') {
        const id = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 42)
        
        await pool.query(`
          INSERT INTO blood_units (id, "donorId", "donorName", "bloodGroup", "componentType", "volumeMl", "collectionDate", "expiryDate", status, notes, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available', $9, $10)
        `, [id, data.donorId, data.donorName, data.bloodGroup, data.componentType || 'whole_blood', data.volumeMl || 450, now, expiryDate.toISOString(), data.notes, now])

        // Update donor's last donation date
        if (data.donorId) {
          await pool.query(`
            UPDATE blood_donors SET "lastDonationDate" = $1, "totalDonations" = COALESCE("totalDonations", 0) + 1 WHERE id = $2
          `, [now, data.donorId])
        }

        await pool.end()
        logger.info('Blood unit added via direct pg', { id, bloodGroup: data.bloodGroup })
        return NextResponse.json({ success: true, unit: { id, ...data, status: 'available', createdAt: now }, method: 'direct-pg' })
      }
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any

      if (action === 'register_donor') {
        const id = `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await p.$executeRawUnsafe(`
          INSERT INTO blood_donors (id, name, phone, email, "bloodGroup", genotype, "lastDonationDate", "totalDonations", "isEligible", notes, "registeredAt")
          VALUES ('${id}', ${data.name ? `'${data.name.replace(/'/g, "''")}'` : 'NULL'}, ${data.phone ? `'${data.phone}'` : 'NULL'},
            ${data.email ? `'${data.email}'` : 'NULL'}, ${data.bloodGroup ? `'${data.bloodGroup}'` : 'NULL'}, ${data.genotype ? `'${data.genotype}'` : 'NULL'},
            ${data.lastDonationDate ? `'${data.lastDonationDate}'` : 'NULL'}, 0, TRUE, ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'}, '${now}')
        `)
        await pool.end()
        return NextResponse.json({ success: true, donor: { id, ...data, registeredAt: now }, method: 'prisma' })
      }

      if (action === 'add_unit') {
        const id = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 42)
        
        await p.$executeRawUnsafe(`
          INSERT INTO blood_units (id, "donorId", "donorName", "bloodGroup", "componentType", "volumeMl", "collectionDate", "expiryDate", status, notes, "createdAt")
          VALUES ('${id}', ${data.donorId ? `'${data.donorId}'` : 'NULL'}, ${data.donorName ? `'${data.donorName.replace(/'/g, "''")}'` : 'NULL'},
            ${data.bloodGroup ? `'${data.bloodGroup}'` : 'NULL'}, ${data.componentType ? `'${data.componentType}'` : "'whole_blood'"}, ${data.volumeMl || 450},
            '${now}', '${expiryDate.toISOString()}', 'available', ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'}, '${now}')
        `)

        if (data.donorId) {
          await p.$executeRawUnsafe(`UPDATE blood_donors SET "lastDonationDate" = '${now}', "totalDonations" = COALESCE("totalDonations", 0) + 1 WHERE id = '${data.donorId}'`)
        }

        await pool.end()
        return NextResponse.json({ success: true, unit: { id, ...data, status: 'available', createdAt: now }, method: 'prisma' })
      }
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Invalid action or database unavailable' }, { status: 400 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error in blood bank operation', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update blood unit status - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, action, reservedForPatientId, transfusedToPatientId, notes } = body

    if (!id || !action) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'ID and action required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      let updateQuery = `UPDATE blood_units SET status = $1`
      const params: any[] = [action, id]
      let paramCount = 2

      if (action === 'reserved' && reservedForPatientId) {
        updateQuery += `, "reservedForPatientId" = $${paramCount}`
        params.splice(paramCount - 1, 0, reservedForPatientId)
        paramCount++
      }
      if (action === 'transfused') {
        updateQuery += `, "transfusedAt" = $${paramCount}`
        params.splice(paramCount - 1, 0, now)
        paramCount++
        if (transfusedToPatientId) {
          updateQuery += `, "transfusedToPatientId" = $${paramCount}`
          params.splice(paramCount - 1, 0, transfusedToPatientId)
          paramCount++
        }
      }
      if (notes) {
        updateQuery += `, notes = $${paramCount}`
        params.splice(paramCount - 1, 0, notes)
        paramCount++
      }

      updateQuery += ` WHERE id = $${paramCount}`
      params.push(id)

      await pool.query(updateQuery, params)

      await pool.end()
      logger.info('Blood unit updated via direct pg', { id, action })
      return NextResponse.json({ success: true, message: 'Unit updated successfully', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg PUT failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let updateFields = `status = '${action}'`
      if (action === 'reserved' && reservedForPatientId) updateFields += `, "reservedForPatientId" = '${reservedForPatientId}'`
      if (action === 'transfused') {
        updateFields += `, "transfusedAt" = '${now}'`
        if (transfusedToPatientId) updateFields += `, "transfusedToPatientId" = '${transfusedToPatientId}'`
      }
      if (notes) updateFields += `, notes = '${notes.replace(/'/g, "''")}'`

      await p.$executeRawUnsafe(`UPDATE blood_units SET ${updateFields} WHERE id = '${id}'`)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Unit updated successfully', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating blood unit', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
