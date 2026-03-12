// Blood Bank API - Donors and Blood Units Management
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BloodBankAPI')

// GET - Fetch blood bank data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'donors', 'units', or 'all'
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, donors: [], units: [], mode: 'demo' })
    }

    const p = prisma as any

    let donors: any[] = []
    let units: any[] = []

    if (type === 'donors' || type === 'all') {
      donors = await p.$queryRawUnsafe(`
        SELECT * FROM blood_donors 
        ORDER BY "registeredAt" DESC
        LIMIT 100
      `) || []
    }

    if (type === 'units' || type === 'all') {
      units = await p.$queryRawUnsafe(`
        SELECT * FROM blood_units 
        ORDER BY "createdAt" DESC
        LIMIT 100
      `) || []
    }

    // Calculate inventory summary
    const inventory = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
    }
    
    units.forEach((unit: any) => {
      if (unit.status === 'available' && unit.bloodGroup) {
        inventory[unit.bloodGroup as keyof typeof inventory]++
      }
    })

    return NextResponse.json({ 
      success: true, 
      donors, 
      units,
      inventory,
      totalDonors: donors.length,
      availableUnits: units.filter((u: any) => u.status === 'available').length
    })
  } catch (error: any) {
    logger.error('Error fetching blood bank data', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Register donor or add blood unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    if (action === 'register_donor') {
      const id = `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await p.$executeRawUnsafe(`
        INSERT INTO blood_donors (
          id, name, phone, email, "bloodGroup", genotype,
          "lastDonationDate", "totalDonations", "isEligible", notes, "registeredAt"
        ) VALUES (
          '${id}',
          ${data.name ? `'${data.name.replace(/'/g, "''")}'` : 'NULL'},
          ${data.phone ? `'${data.phone}'` : 'NULL'},
          ${data.email ? `'${data.email}'` : 'NULL'},
          ${data.bloodGroup ? `'${data.bloodGroup}'` : 'NULL'},
          ${data.genotype ? `'${data.genotype}'` : 'NULL'},
          ${data.lastDonationDate ? `'${data.lastDonationDate}'` : 'NULL'},
          0,
          TRUE,
          ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'},
          '${now}'
        )
      `)

      logger.info('Blood donor registered', { id, name: data.name, bloodGroup: data.bloodGroup })
      return NextResponse.json({ success: true, donor: { id, ...data, registeredAt: now } })
    }

    if (action === 'add_unit') {
      const id = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 42) // 42 days shelf life for whole blood
      
      await p.$executeRawUnsafe(`
        INSERT INTO blood_units (
          id, "donorId", "donorName", "bloodGroup", "componentType",
          "volumeMl", "collectionDate", "expiryDate", status, notes, "createdAt"
        ) VALUES (
          '${id}',
          ${data.donorId ? `'${data.donorId}'` : 'NULL'},
          ${data.donorName ? `'${data.donorName.replace(/'/g, "''")}'` : 'NULL'},
          ${data.bloodGroup ? `'${data.bloodGroup}'` : 'NULL'},
          ${data.componentType ? `'${data.componentType}'` : "'whole_blood'"},
          ${data.volumeMl || 450},
          '${now}',
          '${expiryDate.toISOString()}',
          'available',
          ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'},
          '${now}'
        )
      `)

      // Update donor's last donation date and total donations
      if (data.donorId) {
        await p.$executeRawUnsafe(`
          UPDATE blood_donors 
          SET 
            "lastDonationDate" = '${now}',
            "totalDonations" = COALESCE("totalDonations", 0) + 1
          WHERE id = '${data.donorId}'
        `)
      }

      logger.info('Blood unit added', { id, bloodGroup: data.bloodGroup })
      return NextResponse.json({ success: true, unit: { id, ...data, status: 'available', createdAt: now } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    logger.error('Error in blood bank operation', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update blood unit status (reserve, transfuse, discard)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, reservedForPatientId, transfusedToPatientId, notes } = body

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'ID and action required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    let updateFields = `status = '${action}'`
    if (action === 'reserved' && reservedForPatientId) {
      updateFields += `, "reservedForPatientId" = '${reservedForPatientId}'`
    }
    if (action === 'transfused') {
      updateFields += `, "transfusedAt" = '${now}'`
      if (transfusedToPatientId) {
        updateFields += `, "transfusedToPatientId" = '${transfusedToPatientId}'`
      }
    }
    if (notes) {
      updateFields += `, notes = '${notes.replace(/'/g, "''")}'`
    }

    await p.$executeRawUnsafe(`
      UPDATE blood_units SET ${updateFields} WHERE id = '${id}'
    `)

    logger.info('Blood unit updated', { id, action })
    return NextResponse.json({ success: true, message: 'Unit updated successfully' })
  } catch (error: any) {
    logger.error('Error updating blood unit', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
