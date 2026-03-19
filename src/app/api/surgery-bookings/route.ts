// Surgery Bookings API - Prisma/SQLite Implementation
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, Errors } from '@/lib/errors'

const logger = createLogger('SurgeryBookingsAPI')

// GET - Fetch all surgery bookings
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const bookings = await p.surgeryBookings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ success: true, bookings, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error fetching surgery bookings', { error: error.message })
    return errorResponse(error, { module: 'SurgeryBookings', operation: 'get' })
  }
}

// POST - Create new surgery booking
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { patientId, patient, surgeryType, surgeonId, surgeonName, anesthetistId, anesthetistName,
            theatreId, theatreName, scheduledDate, scheduledTime, estimatedDuration, priority,
            preOpChecklist, notes, bookedBy } = body

    const id = `surgery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const booking = await p.surgeryBookings.create({
      data: {
        id,
        patientId,
        patient: patient || {},
        surgeryType,
        surgeonId,
        surgeonName,
        anesthetistId,
        anesthetistName,
        theatreId,
        theatreName,
        scheduledDate,
        scheduledTime,
        estimatedDuration,
        priority: priority || 'routine',
        preOpChecklist: preOpChecklist || {},
        notes,
        bookedBy,
        status: 'scheduled',
        createdAt: now,
        updatedAt: now
      }
    })

    logger.info('Surgery booking created', { id, surgeryType })

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

    return NextResponse.json({ success: true, booking: { id, ...body, status: 'scheduled', createdAt: now }, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error creating surgery booking', { error: error.message })
    return errorResponse(error, { module: 'SurgeryBookings', operation: 'create' })
  }
}

// PUT - Update surgery booking
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { id, status, notes, preOpChecklist } = body

    if (!id) {
      throw Errors.validation('Booking ID required')
    }

    const now = new Date().toISOString()

    const updateData: any = { updatedAt: now }
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (preOpChecklist !== undefined) updateData.preOpChecklist = preOpChecklist

    await p.surgeryBookings.update({
      where: { id },
      data: updateData
    })

    logger.info('Surgery booking updated', { id, status })
    return NextResponse.json({ success: true, message: 'Booking updated successfully', method: 'prisma' })

  } catch (error: any) {
    logger.error('Error updating surgery booking', { error: error.message })
    return errorResponse(error, { module: 'SurgeryBookings', operation: 'update' })
  }
}
