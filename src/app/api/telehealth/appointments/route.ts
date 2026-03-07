import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-session'
import prisma from '@/lib/telehealth-db'

// GET - Fetch appointments for current user
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let appointments

    if (session.role === 'doctor') {
      // Get doctor's appointments
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.userId }
      })

      if (!doctor) {
        return NextResponse.json({ appointments: [] })
      }

      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { scheduledAt: 'desc' }
      })
    } else {
      // Get patient's appointments
      const patient = await prisma.patient.findFirst({
        where: { userId: session.userId }
      })

      if (!patient) {
        return NextResponse.json({ appointments: [] })
      }

      appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { scheduledAt: 'desc' }
      })
    }

    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error('Fetch appointments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { doctorId, scheduledAt, type, notes } = body

    // Get patient
    const patient = await prisma.patient.findFirst({
      where: { userId: session.userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Generate meeting room ID
    const meetingRoom = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: new Date(scheduledAt),
        type: type || 'video',
        notes,
        meetingRoom
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ appointment })
  } catch (error: any) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
