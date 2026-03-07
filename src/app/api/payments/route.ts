import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-auth'
import { db } from '@/lib/telehealth-db'

// Create payment record for bank transfer
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user || user.role !== 'patient') {
      return NextResponse.json(
        { error: 'Only patients can make payments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { appointmentId, amount, paymentReference } = body

    const patient = await db.patient.findUnique({
      where: { userId: user.id }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Get appointment with doctor details
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Create payment record with doctor's bank details
    const payment = await db.payment.create({
      data: {
        patientId: patient.id,
        appointmentId,
        amount,
        currency: 'NGN',
        status: 'awaiting_confirmation',
        // Store doctor's bank details at time of payment
        doctorBankName: appointment.doctor.bankName,
        doctorAccountNumber: appointment.doctor.accountNumber,
        doctorAccountName: appointment.doctor.accountName,
        paymentReference,
        paymentDate: new Date(),
      }
    })

    // Update appointment status
    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: 'pending_payment' }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment record created. Awaiting doctor confirmation.',
      payment
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment record' },
      { status: 500 }
    )
  }
}

// Confirm payment (Doctor only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can confirm payments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { paymentId, status } = body // status: 'confirmed' or 'rejected'

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      )
    }

    // Update payment
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        confirmedAt: new Date(),
        confirmedBy: doctor.id,
      }
    })

    // If confirmed, update appointment status
    if (status === 'confirmed' && payment.appointmentId) {
      await db.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'scheduled' }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${status}`,
      payment
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

// Get payments
export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let payments: any[] = []

    if (user.role === 'patient') {
      const patient = await db.patient.findUnique({
        where: { userId: user.id }
      })

      if (patient) {
        payments = await db.payment.findMany({
          where: { patientId: patient.id },
          include: {
            appointment: {
              include: {
                doctor: {
                  include: {
                    user: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      }
    } else if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({
        where: { userId: user.id }
      })

      if (doctor) {
        payments = await db.payment.findMany({
          where: {
            appointment: {
              doctorId: doctor.id
            }
          },
          include: {
            patient: {
              include: {
                user: {
                  select: { name: true, email: true, phone: true }
                }
              }
            },
            appointment: true
          },
          orderBy: { createdAt: 'desc' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      payments
    })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'Failed to get payments' },
      { status: 500 }
    )
  }
}
