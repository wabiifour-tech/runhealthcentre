// Surgery Bookings API
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SurgeryBookingsAPI')

// GET - Fetch all surgery bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, bookings: [], mode: 'demo' })
    }

    const p = prisma as any
    
    let whereClause = '1=1'
    if (status) {
      whereClause = `status = '${status}'`
    }

    const bookings = await p.$queryRawUnsafe(`
      SELECT * FROM surgery_bookings 
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT 100
    `)

    return NextResponse.json({ success: true, bookings: bookings || [] })
  } catch (error: any) {
    logger.error('Error fetching surgery bookings', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new surgery booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      patientId, patient, surgeryType, surgeonId, surgeonName, 
      anesthetistId, anesthetistName, theatreId, theatreName,
      scheduledDate, scheduledTime, estimatedDuration, priority,
      preOpChecklist, notes, bookedBy 
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const id = `surgery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      INSERT INTO surgery_bookings (
        id, "patientId", patient, "surgeryType", "surgeonId", "surgeonName",
        "anesthetistId", "anesthetistName", "theatreId", "theatreName",
        "scheduledDate", "scheduledTime", "estimatedDuration", priority,
        "preOpChecklist", notes, "bookedBy", status, "createdAt", "updatedAt"
      ) VALUES (
        '${id}',
        ${patientId ? `'${patientId}'` : 'NULL'},
        ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
        ${surgeryType ? `'${surgeryType.replace(/'/g, "''")}'` : 'NULL'},
        ${surgeonId ? `'${surgeonId}'` : 'NULL'},
        ${surgeonName ? `'${surgeonName.replace(/'/g, "''")}'` : 'NULL'},
        ${anesthetistId ? `'${anesthetistId}'` : 'NULL'},
        ${anesthetistName ? `'${anesthetistName.replace(/'/g, "''")}'` : 'NULL'},
        ${theatreId ? `'${theatreId}'` : 'NULL'},
        ${theatreName ? `'${theatreName.replace(/'/g, "''")}'` : 'NULL'},
        ${scheduledDate ? `'${scheduledDate}'` : 'NULL'},
        ${scheduledTime ? `'${scheduledTime}'` : 'NULL'},
        ${estimatedDuration || 'NULL'},
        ${priority ? `'${priority}'` : "'routine'"},
        ${preOpChecklist ? `'${JSON.stringify(preOpChecklist).replace(/'/g, "''")}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        ${bookedBy ? `'${bookedBy}'` : 'NULL'},
        'scheduled',
        '${now}',
        '${now}'
      )
    `)

    logger.info('Surgery booking created', { id, surgeryType })

    // Create notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'surgery_booking',
          title: 'New Surgery Scheduled',
          message: `Surgery scheduled for ${patient?.name || 'patient'} - ${surgeryType}`,
          targetRoles: ['DOCTOR', 'NURSE', 'ADMIN'],
          priority: priority === 'emergency' ? 'high' : 'normal',
          data: { bookingId: id, patientId, surgeryType }
        })
      })
    } catch {}

    return NextResponse.json({ success: true, booking: { id, ...body, status: 'scheduled', createdAt: now } })
  } catch (error: any) {
    logger.error('Error creating surgery booking', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update surgery booking
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, preOpChecklist } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      UPDATE surgery_bookings 
      SET 
        status = ${status ? `'${status}'` : 'status'},
        notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'},
        "preOpChecklist" = ${preOpChecklist ? `'${JSON.stringify(preOpChecklist).replace(/'/g, "''")}'` : '"preOpChecklist"'},
        "updatedAt" = '${now}'
      WHERE id = '${id}'
    `)

    logger.info('Surgery booking updated', { id, status })

    return NextResponse.json({ success: true, message: 'Booking updated successfully' })
  } catch (error: any) {
    logger.error('Error updating surgery booking', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
