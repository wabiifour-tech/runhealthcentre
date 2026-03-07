import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-session'
import prisma from '@/lib/telehealth-db'

// GET - Fetch payments for current patient
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const patient = await prisma.patient.findFirst({
      where: { userId: session.userId }
    })

    if (!patient) {
      return NextResponse.json({ payments: [] })
    }

    const payments = await prisma.payment.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Fetch payments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST - Initialize payment with Paystack
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
    const { amount, appointmentId } = body

    const patient = await prisma.patient.findFirst({
      where: { userId: session.userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Create payment record
    const paystackRef = `ref-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const payment = await prisma.payment.create({
      data: {
        patientId: patient.id,
        appointmentId,
        amount,
        currency: 'NGN',
        status: 'pending',
        paystackRef
      }
    })

    // In production, you would call Paystack API here
    // For demo, we'll return a mock payment URL
    const paymentUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment/${paystackRef}`

    return NextResponse.json({
      payment,
      paymentUrl,
      paystackRef
    })
  } catch (error: any) {
    console.error('Initialize payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
