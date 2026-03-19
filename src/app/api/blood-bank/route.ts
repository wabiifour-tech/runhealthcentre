// Blood Bank API - Prisma/SQLite Implementation
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, Errors } from '@/lib/errors'

const logger = createLogger('BloodBankAPI')

// GET - Fetch blood bank data
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let donors: any[] = []
    let units: any[] = []

    if (type === 'donors' || type === 'all') {
      donors = await p.bloodDonors.findMany({
        orderBy: { registeredAt: 'desc' },
        take: 100
      })
    }

    if (type === 'units' || type === 'all') {
      units = await p.bloodUnits.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      })
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

    return NextResponse.json({ 
      success: true, donors, units, inventory,
      totalDonors: donors.length,
      availableUnits: units.filter((u: any) => u.status === 'available').length,
      method: 'prisma'
    })

  } catch (error: any) {
    logger.error('Error fetching blood bank data', { error: error.message })
    return errorResponse(error, { module: 'BloodBank', operation: 'get' })
  }
}

// POST - Register donor or add blood unit
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { action, ...data } = body
    const now = new Date().toISOString()

    if (action === 'register_donor') {
      const id = `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const donor = await p.bloodDonors.create({
        data: {
          id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          bloodGroup: data.bloodGroup,
          genotype: data.genotype,
          lastDonationDate: data.lastDonationDate,
          totalDonations: 0,
          isEligible: true,
          notes: data.notes,
          registeredAt: now
        }
      })

      logger.info('Blood donor registered', { id, name: data.name })
      return NextResponse.json({ success: true, donor: { id, ...data, registeredAt: now }, method: 'prisma' })
    }

    if (action === 'add_unit') {
      const id = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 42)
      
      const unit = await p.bloodUnits.create({
        data: {
          id,
          donorId: data.donorId,
          donorName: data.donorName,
          bloodGroup: data.bloodGroup,
          componentType: data.componentType || 'whole_blood',
          volumeMl: data.volumeMl || 450,
          collectionDate: now,
          expiryDate: expiryDate.toISOString(),
          status: 'available',
          notes: data.notes,
          createdAt: now
        }
      })

      // Update donor's last donation date
      if (data.donorId) {
        const donor = await p.bloodDonors.findUnique({
          where: { id: data.donorId }
        })
        if (donor) {
          await p.bloodDonors.update({
            where: { id: data.donorId },
            data: {
              lastDonationDate: now,
              totalDonations: (donor.totalDonations || 0) + 1
            }
          })
        }
      }

      logger.info('Blood unit added', { id, bloodGroup: data.bloodGroup })
      return NextResponse.json({ success: true, unit: { id, ...data, status: 'available', createdAt: now }, method: 'prisma' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    logger.error('Error in blood bank operation', { error: error.message })
    return errorResponse(error, { module: 'BloodBank', operation: 'create' })
  }
}

// PUT - Update blood unit status
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { id, action, reservedForPatientId, transfusedToPatientId, notes } = body

    if (!id || !action) {
      throw Errors.validation('ID and action required')
    }

    const now = new Date().toISOString()

    const updateData: any = { status: action }
    
    if (action === 'reserved' && reservedForPatientId) {
      updateData.reservedForPatientId = reservedForPatientId
    }
    
    if (action === 'transfused') {
      updateData.transfusedAt = now
      if (transfusedToPatientId) {
        updateData.transfusedToPatientId = transfusedToPatientId
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    await p.bloodUnits.update({
      where: { id },
      data: updateData
    })

    logger.info('Blood unit updated', { id, action })
    return NextResponse.json({ success: true, message: 'Unit updated successfully', method: 'prisma' })

  } catch (error: any) {
    logger.error('Error updating blood unit', { error: error.message })
    return errorResponse(error, { module: 'BloodBank', operation: 'update' })
  }
}
