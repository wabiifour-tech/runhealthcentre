import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Payments')

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
      throw Errors.validation('Amount and email are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw Errors.validation('Invalid email format')
    }

    // Validate amount (minimum 100 kobo = 1 naira for Paystack)
    if (amount < 100) {
      throw Errors.validation('Minimum amount is ₦1')
    }

    const paymentReference = reference || generateReference()
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    // Production: Integrate with actual Paystack API
    if (secretKey) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
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
          logger.error('Paystack initialization failed', { 
            reference: paymentReference,
            error: data.message 
          })
          throw Errors.database('Payment initialization failed')
        }

        logger.info('Payment initialized successfully', {
          reference: paymentReference,
          amount,
          email,
          type: metadata?.type || 'general'
        })

        return successResponse({
          data: {
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference
          }
        })
      } catch (fetchError) {
        logger.error('Paystack API error', { error: String(fetchError) })
        throw Errors.database('Payment service unavailable')
      }
    }

    // Demo/Simulation mode
    const mockPaymentData = {
      authorization_url: `https://paystack.com/pay/${paymentReference}`,
      access_code: `access_${Date.now()}`,
      reference: paymentReference
    }

    logger.info('Payment initialized (demo mode)', {
      reference: paymentReference,
      amount,
      email,
      type: metadata?.type || 'general'
    })

    return successResponse({
      mode: 'demo',
      message: 'Demo mode - Configure PAYSTACK_SECRET_KEY for live payments',
      data: mockPaymentData
    })

  } catch (error) {
    return errorResponse(error, { module: 'Payments', operation: 'initialize' })
  }
}

export async function GET() {
  return successResponse({
    service: 'RUN Health Centre Payment Service',
    status: 'active',
    provider: 'Paystack',
    mode: process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo',
    currencies: ['NGN'],
    note: 'To enable live payments, configure PAYSTACK_SECRET_KEY in your environment variables'
  })
}
