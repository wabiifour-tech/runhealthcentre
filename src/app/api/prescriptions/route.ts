import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-auth'
import { db } from '@/lib/telehealth-db'

// Get prescriptions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let prescriptions: any[] = []

    if (user.role === 'patient') {
      const patient = await db.patient.findUnique({
        where: { userId: user.id }
      })

      if (!patient) {
        return NextResponse.json({ prescriptions: [] })
      }

      prescriptions = await db.prescription.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          appointment: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({
        where: { userId: user.id }
      })

      if (!doctor) {
        return NextResponse.json({ prescriptions: [] })
      }

      prescriptions = await db.prescription.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          appointment: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({
      success: true,
      prescriptions
    })
  } catch (error) {
    console.error('Get prescriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to get prescriptions' },
      { status: 500 }
    )
  }
}

// Create prescription
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create prescriptions' },
        { status: 403 }
      )
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { appointmentId, diagnosis, medications, advice, followUpDate } = body

    // Get appointment to find patient
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const prescription = await db.prescription.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        diagnosis,
        medications: JSON.stringify(medications),
        advice,
        followUpDate
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

    return NextResponse.json({
      success: true,
      message: 'Prescription created successfully',
      prescription
    })
  } catch (error) {
    console.error('Create prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}
