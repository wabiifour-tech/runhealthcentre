import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import crypto from 'crypto'

const logger = createLogger('Payments')

// Paystack Payment Verification
// This endpoint verifies payment status after payment completion

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      throw Errors.validation('Payment reference is required')
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY

    // Production: Verify with actual Paystack API
    if (secretKey) {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          }
        })

        const data = await response.json()
        
        if (data.status && data.data.status === 'success') {
          logger.info('Payment verified successfully', { 
            reference, 
            amount: data.data.amount / 100 
          })
          
          return successResponse({
            status: 'success',
            data: {
              reference: data.data.reference,
              amount: data.data.amount / 100, // Convert from kobo
              paid_at: data.data.paid_at,
              channel: data.data.channel,
              customer: {
                email: data.data.customer?.email
              }
            }
          })
        }

        logger.warn('Payment verification failed', { reference, status: data.data?.status })
        return errorResponse(Errors.validation('Payment verification failed'))
      } catch (fetchError) {
        logger.error('Paystack API error', { error: String(fetchError) })
        throw Errors.database('Payment verification service unavailable')
      }
    }

    // Demo mode - Simulate successful verification
    logger.info('Payment verified (demo mode)', { reference })

    return successResponse({
      status: 'success',
      mode: 'demo',
      data: {
        reference,
        amount: 10000, // Demo amount
        paid_at: new Date().toISOString(),
        channel: 'card',
        customer: {
          email: 'demo@example.com'
        }
      }
    })
  } catch (error) {
    return errorResponse(error, { module: 'Payments', operation: 'verify' })
  }
}

// Webhook handler for Paystack
export async function POST(request: NextRequest) {
  try {
    const body = await request.text() // Get raw body for signature verification
    const secret = process.env.PAYSTACK_SECRET_KEY

    // Verify webhook signature in production
    if (secret) {
      const signature = request.headers.get('x-paystack-signature')
      
      if (!signature) {
        logger.warn('Webhook received without signature')
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
      }

      // Compute HMAC SHA512 signature
      const computedSignature = crypto
        .createHmac('sha512', secret)
        .update(body)
        .digest('hex')

      // Constant-time comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      )) {
        logger.warn('Webhook signature verification failed', { 
          providedSignature: signature.substring(0, 8) + '...' 
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      logger.info('Webhook signature verified successfully')
    }

    const payload = JSON.parse(body)
    const { event, data } = payload

    logger.info('Webhook received', { event, reference: data?.reference })

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        logger.info('Payment successful', { 
          reference: data.reference,
          amount: data.amount / 100,
          email: data.customer?.email
        })
        // TODO: Update payment status in database
        // TODO: Send confirmation email/SMS
        break
      
      case 'charge.failed':
        logger.warn('Payment failed', { 
          reference: data.reference,
          reason: data.gateway_response 
        })
        // TODO: Notify user of failed payment
        break
      
      case 'transfer.success':
        logger.info('Transfer successful', { reference: data.reference })
        break
      
      case 'subscription.create':
        logger.info('Subscription created', { 
          reference: data.reference,
          customer: data.customer?.email 
        })
        break
      
      default:
        logger.info('Unhandled webhook event', { event })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Webhook processing error', { error: String(error) })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
