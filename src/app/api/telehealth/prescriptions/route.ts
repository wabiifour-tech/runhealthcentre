import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-session'
import prisma from '@/lib/telehealth-db'

// GET - Fetch prescriptions for current user
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let prescriptions

    if (session.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.userId }
      })

      if (!doctor) {
        return NextResponse.json({ prescriptions: [] })
      }

      prescriptions = await prisma.prescription.findMany({
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
        orderBy: { createdAt: 'desc' }
      })
    } else {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.userId }
      })

      if (!patient) {
        return NextResponse.json({ prescriptions: [] })
      }

      prescriptions = await prisma.prescription.findMany({
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
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ prescriptions })
  } catch (error: any) {
    console.error('Fetch prescriptions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}

// POST - Create new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create prescriptions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { appointmentId, diagnosis, medications, notes } = body

    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.userId }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    // Get appointment to find patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        diagnosis,
        medications,
        notes
      },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ prescription })
  } catch (error: any) {
    console.error('Create prescription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create prescription' },
      { status: 500 }
    )
  }
}
