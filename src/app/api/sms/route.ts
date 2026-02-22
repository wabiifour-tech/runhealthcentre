import { NextRequest, NextResponse } from 'next/server'

interface SMSRequest {
  to: string | string[] // Phone number(s) - can be single or array for bulk
  message: string
  type: 'appointment' | 'lab_result' | 'prescription' | 'billing' | 'custom' | 'emergency' | 'bulk'
  patientName?: string
  patientId?: string
  data?: Record<string, any>
  sender?: string // Optional sender ID
}

// Termii API Configuration (set these in your .env file)
const TERMII_API_KEY = process.env.TERMII_API_KEY || ''
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'RUHC'
const SMS_MODE = process.env.SMS_MODE || 'simulation' // 'simulation' or 'production'

// SMS templates for different notification types
const smsTemplates = {
  appointment: (data: Record<string, any>) => 
    `RUHC Reminder: Dear ${data.patientName || 'Patient'}, your appointment is on ${data.date} at ${data.time} with ${data.doctor || 'Doctor'}. Arrive 15 mins early. RUN Health Centre.`,
  
  lab_result: (data: Record<string, any>) => 
    `RUHC Lab: Dear ${data.patientName || 'Patient'}, your ${data.testName || 'lab test'} results are ready. Visit the lab to collect. RUN Health Centre.`,
  
  prescription: (data: Record<string, any>) => 
    `RUHC Pharmacy: Dear ${data.patientName || 'Patient'}, your prescription is ready. Collect at the pharmacy during working hours (8AM-6PM). RUN Health Centre.`,
  
  billing: (data: Record<string, any>) => 
    `RUHC Billing: Dear ${data.patientName || 'Patient'}, your bill of ₦${data.amount?.toLocaleString() || '0'} is ready. Invoice: ${data.invoiceNo}. Visit billing for payment. RUN Health Centre.`,
  
  emergency: (data: Record<string, any>) => 
    `URGENT RUHC: ${data.message || 'Emergency notification'}. Please contact RUN Health Centre immediately. ${data.contactNumber || 'Tel: +234-XXX-XXX-XXXX'}`,
  
  bulk: (data: Record<string, any>) => 
    `RUHC: ${data.message || ''}`.substring(0, 160),
  
  custom: (data: Record<string, any>) => 
    `RUHC: ${data.message || ''}`.substring(0, 160)
}

// Nigerian phone number formatting for international format (required by Termii)
function formatForTermii(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  
  // Convert to international format (234XXXXXXXXXX)
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1)
  } else if (cleaned.startsWith('+234')) {
    cleaned = cleaned.slice(1)
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned
  }
  
  return cleaned
}

// Nigerian phone number formatting for local display
function formatNigerianNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('234')) {
    cleaned = '0' + cleaned.slice(3)
  } else if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned
  }
  
  return cleaned
}

// Validate phone number
function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 13
}

// SMS notification log storage (in-memory for demo, use database in production)
const smsLog: Array<{
  id: string
  to: string
  message: string
  type: string
  patientName?: string
  patientId?: string
  status: 'sent' | 'failed' | 'pending' | 'delivered'
  sentAt: string
  deliveredAt?: string
  cost?: number
  messageId?: string
  mode: 'simulation' | 'production'
}> = []

// Send SMS via Termii API
async function sendViaTermii(to: string, message: string, sender: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TERMII_API_KEY) {
    return { success: false, error: 'TERMII_API_KEY not configured' }
  }
  
  try {
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formatForTermii(to),
        from: sender || TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        api_key: TERMII_API_KEY,
        channel: 'generic'
      })
    })
    
    const result = await response.json()
    
    if (result.message_id) {
      return { success: true, messageId: result.message_id }
    } else {
      return { success: false, error: result.message || 'Unknown error' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Send bulk SMS via Termii API
async function sendBulkViaTermii(recipients: string[], message: string, sender: string): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  if (!TERMII_API_KEY) {
    return { success: false, sent: 0, failed: recipients.length, errors: ['TERMII_API_KEY not configured'] }
  }
  
  const results = { success: true, sent: 0, failed: 0, errors: [] as string[] }
  
  // Process in batches of 100 (Termii limit)
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100)
    const formattedNumbers = batch.map(n => formatForTermii(n))
    
    try {
      const response = await fetch('https://api.ng.termii.com/api/sms/send/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedNumbers.join(','),
          from: sender || TERMII_SENDER_ID,
          sms: message,
          type: 'plain',
          api_key: TERMII_API_KEY,
          channel: 'generic'
        })
      })
      
      const result = await response.json()
      
      if (result.code === 'ok') {
        results.sent += batch.length
      } else {
        results.failed += batch.length
        results.errors.push(result.message || 'Batch failed')
      }
    } catch (error: any) {
      results.failed += batch.length
      results.errors.push(error.message)
    }
  }
  
  results.success = results.failed === 0
  return results
}

export async function POST(request: NextRequest) {
  try {
    const body: SMSRequest = await request.json()
    let { to, message, type, patientName, patientId, data = {}, sender } = body

    // Handle bulk SMS (array of recipients)
    const isBulk = Array.isArray(to)
    const recipients = isBulk ? to : [to]
    
    // Validate phone numbers
    const invalidNumbers = recipients.filter(phone => !isValidPhoneNumber(phone))
    if (invalidNumbers.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid phone number(s): ${invalidNumbers.slice(0, 3).join(', ')}${invalidNumbers.length > 3 ? '...' : ''}`
      }, { status: 400 })
    }

    // Generate message from template or use custom
    const smsMessage = data.message ? smsTemplates.custom(data) : smsTemplates[type](data)
    const truncatedMessage = smsMessage.substring(0, 160)

    // Calculate estimated cost (₦2-5 per SMS in Nigeria)
    const estimatedCost = 4 * recipients.length
    const isProduction = SMS_MODE === 'production' && TERMII_API_KEY

    // Process SMS sending
    if (isProduction) {
      // ACTUAL SMS SENDING
      if (isBulk && recipients.length > 1) {
        const result = await sendBulkViaTermii(recipients, truncatedMessage, sender || TERMII_SENDER_ID)
        
        const logEntry = {
          id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: `${recipients.length} recipients`,
          message: truncatedMessage,
          type: 'bulk',
          status: result.success ? 'sent' : 'failed' as const,
          sentAt: new Date().toISOString(),
          cost: estimatedCost,
          mode: 'production' as const
        }
        smsLog.push(logEntry)
        
        return NextResponse.json({
          success: result.success,
          message: `Bulk SMS sent: ${result.sent} successful, ${result.failed} failed`,
          data: {
            id: logEntry.id,
            recipients: recipients.length,
            sent: result.sent,
            failed: result.failed,
            errors: result.errors,
            cost: estimatedCost,
            mode: 'production'
          }
        })
      } else {
        // Single SMS
        const result = await sendViaTermii(recipients[0], truncatedMessage, sender || TERMII_SENDER_ID)
        
        const logEntry = {
          id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: formatNigerianNumber(recipients[0]),
          message: truncatedMessage,
          type,
          patientName,
          patientId,
          status: result.success ? 'sent' : 'failed' as const,
          sentAt: new Date().toISOString(),
          cost: estimatedCost,
          messageId: result.messageId,
          mode: 'production' as const
        }
        smsLog.push(logEntry)
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'SMS sent successfully' : `Failed to send SMS: ${result.error}`,
          data: {
            id: logEntry.id,
            to: formatNigerianNumber(recipients[0]),
            messageLength: truncatedMessage.length,
            cost: estimatedCost,
            sentAt: logEntry.sentAt,
            messageId: result.messageId,
            mode: 'production'
          }
        })
      }
    } else {
      // SIMULATION MODE - Logs SMS without actually sending
      console.log('=== SMS SIMULATION MODE ===')
      console.log(`Mode: ${SMS_MODE}`)
      console.log(`Recipients: ${recipients.length}`)
      recipients.forEach((r, i) => {
        console.log(`  ${i + 1}. ${formatNigerianNumber(r)}`)
      })
      console.log(`Message: ${truncatedMessage}`)
      console.log(`Cost: ₦${estimatedCost}`)
      console.log('Set SMS_MODE=production and TERMII_API_KEY to send real SMS')
      console.log('=========================')
      
      // Log each recipient
      const logEntries = recipients.map((recipient, index) => ({
        id: `sms_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        to: formatNigerianNumber(recipient),
        message: truncatedMessage,
        type: isBulk ? 'bulk' : type,
        patientName: isBulk ? undefined : patientName,
        patientId: isBulk ? undefined : patientId,
        status: 'sent' as const,
        sentAt: new Date().toISOString(),
        cost: 4,
        mode: 'simulation' as const
      }))
      
      smsLog.push(...logEntries)
      
      return NextResponse.json({
        success: true,
        message: `SMS simulated successfully (${recipients.length} recipient${recipients.length > 1 ? 's' : ''})`,
        data: {
          ids: logEntries.map(e => e.id),
          recipients: recipients.map(r => formatNigerianNumber(r)),
          recipientCount: recipients.length,
          messageLength: truncatedMessage.length,
          cost: estimatedCost,
          mode: 'simulation',
          note: 'SMS is in SIMULATION mode. Set SMS_MODE=production and TERMII_API_KEY in .env to send real SMS.'
        }
      })
    }

  } catch (error: any) {
    console.error('SMS notification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send SMS notification'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')

  let filteredLogs = [...smsLog]
  
  if (patientId) {
    filteredLogs = filteredLogs.filter(log => log.patientId === patientId)
  }
  
  if (type) {
    filteredLogs = filteredLogs.filter(log => log.type === type)
  }

  return NextResponse.json({
    success: true,
    service: 'RUN Health Centre SMS Notification Service',
    status: 'active',
    mode: SMS_MODE,
    configured: {
      termii: !!TERMII_API_KEY,
      senderId: TERMII_SENDER_ID
    },
    templates: Object.keys(smsTemplates),
    totalSent: smsLog.length,
    recentLogs: filteredLogs.slice(-limit).reverse(),
    instructions: {
      simulation: 'Currently in SIMULATION mode - SMS are logged but not sent',
      production: 'To send real SMS, set these environment variables:',
      envVars: [
        'SMS_MODE=production',
        'TERMII_API_KEY=your_api_key_here',
        'TERMII_SENDER_ID=RUHC (optional, defaults to RUHC)'
      ],
      getApiKey: 'Get a free Termii API key at https://termii.com'
    }
  })
}

export function getSMSLogs() {
  return smsLog
}
