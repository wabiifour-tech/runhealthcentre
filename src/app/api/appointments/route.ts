import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/telehealth-auth'
import { db } from '@/lib/telehealth-db'

// Get appointments
export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    let appointments: any[] = []

    if (user.role === 'patient') {
      const patient = await db.patient.findUnique({
        where: { userId: user.id }
      })

      if (!patient) {
        return NextResponse.json({ appointments: [] })
      }

      appointments = await db.appointment.findMany({
        where: {
          patientId: patient.id,
          ...(status && { status }),
          ...(upcoming && { scheduledAt: { gte: new Date() } })
        },
        include: {
          doctor: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true, avatar: true }
              }
            }
          },
          prescription: true,
          payment: true
        },
        orderBy: { scheduledAt: 'asc' }
      })
    } else if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({
        where: { userId: user.id }
      })

      if (!doctor) {
        return NextResponse.json({ appointments: [] })
      }

      appointments = await db.appointment.findMany({
        where: {
          doctorId: doctor.id,
          ...(status && { status }),
          ...(upcoming && { scheduledAt: { gte: new Date() } })
        },
        include: {
          patient: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true, avatar: true }
              }
            }
          },
          prescription: true,
          payment: true
        },
        orderBy: { scheduledAt: 'asc' }
      })
    }

    return NextResponse.json({
      success: true,
      appointments
    })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'Failed to get appointments' },
      { status: 500 }
    )
  }
}

// Create appointment
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Only patients can book appointments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { doctorId, scheduledAt, duration, type, symptoms } = body

    // Get patient
    const patient = await db.patient.findUnique({
      where: { userId: user.id }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Verify doctor exists
    const doctor = await db.doctor.findUnique({
      where: { id: doctorId }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Generate meeting link
    const meetingLink = `https://telehealthnigeria.com/consultation/${Date.now()}`

    const appointment = await db.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        type: type || 'video',
        symptoms,
        meetingLink,
        status: 'scheduled'
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    // Create pending payment
    await db.payment.create({
      data: {
        patientId: patient.id,
        appointmentId: appointment.id,
        amount: doctor.consultationFee,
        currency: 'NGN',
        status: 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

// Update appointment status
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { appointmentId, status, notes } = body

    const appointment = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        notes
      }
    })

    return NextResponse.json({
      success: true,
      appointment
    })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
