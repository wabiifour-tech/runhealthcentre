// Email Verification API - Send verification code
// Supports: Resend, Brevo, SendGrid, or any SMTP service
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>()

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send email using multiple providers
async function sendEmail(to: string, code: string, name: string = ''): Promise<{ success: boolean; error?: string }> {
  // Check which email service is configured
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  
  // Priority: Brevo > Resend > SendGrid
  if (BREVO_API_KEY) {
    return sendWithBrevo(to, code, name, BREVO_API_KEY)
  } else if (RESEND_API_KEY) {
    return sendWithResend(to, code, name, RESEND_API_KEY)
  } else if (SENDGRID_API_KEY) {
    return sendWithSendGrid(to, code, name, SENDGRID_API_KEY)
  }
  
  console.log('[Email] No API key configured - dev mode')
  return { success: true, error: 'DEV_MODE' }
}

// Brevo (Sendinblue) - Free 300 emails/day, flexible sender
async function sendWithBrevo(to: string, code: string, name: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@brevo.com'
  const SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'RUN Health Centre'
  
  console.log('[Email] Sending via Brevo to:', to)
  console.log('[Email] From:', EMAIL_FROM)
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: EMAIL_FROM,
        },
        to: [{ email: to, name: name || undefined }],
        subject: 'Your Verification Code - RUN Health Centre',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af, #10b981); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">RUN Health Centre</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0;">Staff Registration Verification</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">Hello ${name || 'there'},</h2>
              <p style="color: #475569; font-size: 16px;">Thank you for registering at RUN Health Centre. Please use the following verification code to complete your registration:</p>
              <div style="background: #1e40af; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
              <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                RUN Health Centre - Redeemer's University<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        `,
      }),
    })

    const data = await response.json()
    console.log('[Email] Brevo response status:', response.status)
    console.log('[Email] Brevo response:', JSON.stringify(data))
    
    if (!response.ok) {
      const errorMsg = data.message || data.error?.message || JSON.stringify(data)
      console.error('[Email] Brevo error:', errorMsg)
      return { success: false, error: errorMsg }
    }
    
    console.log('[Email] Brevo success! MessageId:', data.messageId)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Brevo exception:', error)
    return { success: false, error: error.message }
  }
}

// Resend - requires domain verification
async function sendWithResend(to: string, code: string, name: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  
  console.log('[Email] Sending via Resend to:', to)
  console.log('[Email] From:', EMAIL_FROM)
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `RUN Health Centre <${EMAIL_FROM}>`,
        to: [to],
        subject: 'Your Verification Code - RUN Health Centre',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af, #10b981); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">RUN Health Centre</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0;">Staff Registration Verification</p>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">Hello ${name || 'there'},</h2>
              <p style="color: #475569; font-size: 16px;">Thank you for registering at RUN Health Centre. Please use the following verification code to complete your registration:</p>
              <div style="background: #1e40af; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
              <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                RUN Health Centre - Redeemer's University<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        `,
      }),
    })

    const data = await response.json()
    console.log('[Email] Resend response status:', response.status)
    console.log('[Email] Resend response:', JSON.stringify(data))
    
    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data.error || data)
      console.error('[Email] Resend error:', errorMsg)
      return { success: false, error: errorMsg }
    }
    
    console.log('[Email] Resend success! ID:', data.id)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Resend exception:', error)
    return { success: false, error: error.message }
  }
}

// SendGrid - Free 100 emails/day
async function sendWithSendGrid(to: string, code: string, name: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@sendgrid.net'
  
  console.log('[Email] Sending via SendGrid to:', to)
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: name || undefined }] }],
        from: { email: EMAIL_FROM, name: 'RUN Health Centre' },
        subject: 'Your Verification Code - RUN Health Centre',
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e40af, #10b981); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">RUN Health Centre</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0;">Staff Registration Verification</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1e293b; margin-top: 0;">Hello ${name || 'there'},</h2>
                <p style="color: #475569; font-size: 16px;">Thank you for registering at RUN Health Centre. Please use the following verification code to complete your registration:</p>
                <div style="background: #1e40af; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
                  ${code}
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
                <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                  RUN Health Centre - Redeemer's University<br>
                  This is an automated message, please do not reply.
                </p>
              </div>
            </div>
          `
        }]
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      const errorMsg = data.errors?.[0]?.message || JSON.stringify(data)
      console.error('[Email] SendGrid error:', errorMsg)
      return { success: false, error: errorMsg }
    }
    
    console.log('[Email] SendGrid success!')
    return { success: true }
  } catch (error: any) {
    console.error('[Email] SendGrid exception:', error)
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    console.log('[SendVerification] Request received for email:', email)

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }

    // Check if email already exists in database
    try {
      const prisma = await getPrisma()

      if (prisma) {
        const p = prisma as any
        const existingUser = await p.users.findUnique({
          where: { email: email.toLowerCase() }
        })

        if (existingUser) {
          return NextResponse.json({
            success: false,
            error: 'An account with this email already exists. Please sign in instead.'
          }, { status: 400 })
        }
      }
    } catch (e) {
      console.log('[SendVerification] Could not check database for existing user')
    }

    // Generate verification code
    const code = generateCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store the code
    verificationCodes.set(email.toLowerCase(), { 
      code, 
      expiresAt, 
      attempts: 0 
    })

    console.log('[SendVerification] Generated code:', code, 'for email:', email)

    // Send the email
    const emailResult = await sendEmail(email.toLowerCase(), code, name)

    // If no API key (dev mode), return the code
    if (emailResult.error === 'DEV_MODE') {
      return NextResponse.json({ 
        success: true, 
        message: 'Verification code generated (Dev mode - no API key configured)',
        devCode: code,
        note: 'Set BREVO_API_KEY, RESEND_API_KEY, or SENDGRID_API_KEY for production'
      })
    }

    if (!emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email: ' + (emailResult.error || 'Unknown error')
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent to your email'
    })

  } catch (error: any) {
    console.error('[SendVerification] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification code. Please try again.' 
    }, { status: 500 })
  }
}

// Verify the code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    console.log('[VerifyCode] Verifying code for:', email, 'Code:', code)

    if (!email || !code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and verification code are required' 
      }, { status: 400 })
    }

    const stored = verificationCodes.get(email.toLowerCase())

    if (!stored) {
      return NextResponse.json({ 
        success: false, 
        error: 'No verification code found for this email. Please request a new code.' 
      }, { status: 400 })
    }

    // Check if expired
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email.toLowerCase())
      return NextResponse.json({ 
        success: false, 
        error: 'Verification code has expired. Please request a new code.' 
      }, { status: 400 })
    }

    // Check attempts (max 5)
    if (stored.attempts >= 5) {
      verificationCodes.delete(email.toLowerCase())
      return NextResponse.json({ 
        success: false, 
        error: 'Too many failed attempts. Please request a new code.' 
      }, { status: 400 })
    }

    // Verify code
    if (stored.code !== code) {
      stored.attempts++
      return NextResponse.json({ 
        success: false, 
        error: `Invalid verification code. ${5 - stored.attempts} attempts remaining.` 
      }, { status: 400 })
    }

    // Code is valid - remove it so it can't be reused
    verificationCodes.delete(email.toLowerCase())

    console.log('[VerifyCode] Code verified successfully for:', email)

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully'
    })

  } catch (error: any) {
    console.error('[VerifyCode] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify code. Please try again.' 
    }, { status: 500 })
  }
}

// GET endpoint to check configuration
export async function GET() {
  const brevoKey = !!process.env.BREVO_API_KEY
  const resendKey = !!process.env.RESEND_API_KEY
  const sendgridKey = !!process.env.SENDGRID_API_KEY
  
  const configured = brevoKey || resendKey || sendgridKey
  
  let provider = 'none'
  if (brevoKey) provider = 'Brevo'
  else if (resendKey) provider = 'Resend'
  else if (sendgridKey) provider = 'SendGrid'
  
  return NextResponse.json({
    configured,
    provider,
    emailFrom: process.env.EMAIL_FROM || 'not set',
    message: configured 
      ? `Email service configured via ${provider}`
      : 'No email API key found. Set BREVO_API_KEY, RESEND_API_KEY, or SENDGRID_API_KEY'
  })
}
