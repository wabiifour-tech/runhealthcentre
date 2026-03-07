import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-auth'
import { db } from '@/lib/telehealth-db'

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx'
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// Initialize payment
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
    const { appointmentId, amount, email } = body

    const patient = await db.patient.findUnique({
      where: { userId: user.id }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Generate unique reference
    const reference = `THN-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create payment record
    const payment = await db.payment.create({
      data: {
        patientId: patient.id,
        appointmentId,
        amount,
        currency: 'NGN',
        status: 'pending',
        paystackRef: reference
      }
    })

    // Initialize Paystack transaction
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email || user.email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/verify`,
        metadata: {
          paymentId: payment.id,
          appointmentId,
          patientId: patient.id
        }
      })
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Failed to initialize payment', details: paystackData.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}

// Verify payment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    // Verify with Paystack
    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', status: paystackData.data?.status },
        { status: 400 }
      )
    }

    // Update payment record
    const payment = await db.payment.update({
      where: { paystackRef: reference },
      data: {
        status: 'completed',
        paystackData: JSON.stringify(paystackData.data)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
