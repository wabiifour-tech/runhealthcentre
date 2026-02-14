import { NextRequest, NextResponse } from 'next/server'

// Paystack Payment Integration
// Note: In production, add PAYSTACK_SECRET_KEY to your environment variables

interface PaymentRequest {
  amount: number
  email: string
  reference?: string
  callback_url?: string
  metadata?: {
    patientId?: string
    patientName?: string
    invoiceNo?: string
    billId?: string
    type: 'bill_payment' | 'pharmacy' | 'laboratory' | 'consultation'
  }
}

// Generate a unique reference
function generateReference(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  return `RUHC-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    const { amount, email, reference, callback_url, metadata } = body

    // Validate required fields
    if (!amount || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: amount, email'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate amount (minimum 100 kobo = 1 naira for Paystack)
    if (amount < 100) {
      return NextResponse.json({
        success: false,
        error: 'Minimum amount is ₦1'
      }, { status: 400 })
    }

    const paymentReference = reference || generateReference()

    // In production, uncomment this to integrate with actual Paystack API:
    /*
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo
        email,
        reference: paymentReference,
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
        metadata: {
          ...metadata,
          hospital: 'RUN Health Centre',
          custom_fields: [
            {
              display_name: 'Patient Name',
              variable_name: 'patient_name',
              value: metadata?.patientName || 'N/A'
            },
            {
              display_name: 'Invoice Number',
              variable_name: 'invoice_no',
              value: metadata?.invoiceNo || 'N/A'
            }
          ]
        }
      })
    })

    const data = await response.json()
    
    if (!data.status) {
      return NextResponse.json({
        success: false,
        error: data.message || 'Payment initialization failed'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference
      }
    })
    */

    // Demo/Simulation mode - Returns mock payment link
    const mockPaymentData = {
      authorization_url: `https://paystack.com/pay/${paymentReference}`,
      access_code: `access_${Date.now()}`,
      reference: paymentReference
    }

    // Log the payment request
    console.log('=== PAYMENT INITIALIZATION ===')
    console.log(`Reference: ${paymentReference}`)
    console.log(`Amount: ₦${amount.toLocaleString()}`)
    console.log(`Email: ${email}`)
    console.log(`Type: ${metadata?.type || 'general'}`)
    console.log('==============================')

    return NextResponse.json({
      success: true,
      mode: 'demo',
      message: 'Demo mode - Configure PAYSTACK_SECRET_KEY for live payments',
      data: mockPaymentData
    })

  } catch (error: any) {
    console.error('Payment initialization error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initialize payment'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Payment service status
  return NextResponse.json({
    success: true,
    service: 'RUN Health Centre Payment Service',
    status: 'active',
    provider: 'Paystack',
    mode: process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo',
    currencies: ['NGN'],
    note: 'To enable live payments, configure PAYSTACK_SECRET_KEY in your environment variables'
  })
}
