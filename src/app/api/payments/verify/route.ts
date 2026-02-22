import { NextRequest, NextResponse } from 'next/server'

// Paystack Payment Verification
// This endpoint verifies payment status after payment completion

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({
      success: false,
      error: 'Missing payment reference'
    }, { status: 400 })
  }

  // In production, verify with actual Paystack API:
  /*
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }
  })

  const data = await response.json()
  
  if (data.status && data.data.status === 'success') {
    // Payment successful
    // Update your database with payment status
    // Send confirmation email to patient
    
    return NextResponse.json({
      success: true,
      status: 'success',
      data: {
        reference: data.data.reference,
        amount: data.data.amount / 100, // Convert from kobo
        paid_at: data.data.paid_at,
        channel: data.data.channel,
        customer: data.data.customer
      }
    })
  }
  */

  // Demo mode - Simulate successful verification
  console.log('=== PAYMENT VERIFICATION ===')
  console.log(`Reference: ${reference}`)
  console.log('Status: Success (Demo)')
  console.log('===========================')

  return NextResponse.json({
    success: true,
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
}

// Webhook handler for Paystack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In production, verify the webhook signature:
    /*
    const hash = request.headers.get('x-paystack-signature')
    const secret = process.env.PAYSTACK_SECRET_KEY
    
    // Verify HMAC signature
    const computedHash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex')
    
    if (hash !== computedHash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    */

    const { event, data } = body

    console.log('=== PAYSTACK WEBHOOK ===')
    console.log(`Event: ${event}`)
    console.log(`Reference: ${data?.reference}`)
    console.log('=======================')

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        // Payment successful - update database
        console.log(`Payment successful: ${data.reference}`)
        // TODO: Update payment status in database
        // TODO: Send confirmation email
        break
      
      case 'charge.failed':
        // Payment failed
        console.log(`Payment failed: ${data.reference}`)
        break
      
      case 'transfer.success':
        // Transfer successful
        console.log(`Transfer successful: ${data.reference}`)
        break
      
      default:
        console.log(`Unhandled event: ${event}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
