import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Notifications')

interface EmailRequest {
  to: string
  subject: string
  body: string
  type: 'appointment' | 'lab_result' | 'prescription' | 'billing' | 'custom'
  patientName?: string
  data?: Record<string, any>
}

// Email templates
const templates = {
  appointment: (data: Record<string, any>) => `
Dear ${data.patientName || 'Patient'},

This is a reminder of your upcoming appointment at RUN Health Centre.

Appointment Details:
- Date: ${data.date}
- Time: ${data.time}
- Department: ${data.department}
- Doctor: ${data.doctor || 'To be assigned'}

Please arrive 15 minutes before your scheduled time.

If you need to reschedule, please contact us at runhealthcentre@run.edu.ng

Best regards,
RUN Health Centre Team
Redeemer's University, Nigeria
  `,
  lab_result: (data: Record<string, any>) => `
Dear ${data.patientName || 'Patient'},

Your laboratory test results are now available at RUN Health Centre.

Test: ${data.testName}
Status: Ready for collection

Please visit the laboratory department to collect your results or consult with your doctor.

Best regards,
RUN Health Centre Laboratory
Redeemer's University, Nigeria
  `,
  prescription: (data: Record<string, any>) => `
Dear ${data.patientName || 'Patient'},

Your prescription is ready for collection at the RUN Health Centre Pharmacy.

Prescription Details:
- Prescription ID: ${data.prescriptionId}
- Items: ${data.items}

Please visit the pharmacy during working hours (8:00 AM - 6:00 PM) to collect your medications.

Best regards,
RUN Health Centre Pharmacy
Redeemer's University, Nigeria
  `,
  billing: (data: Record<string, any>) => `
Dear ${data.patientName || 'Patient'},

This is a notification regarding your bill at RUN Health Centre.

Bill Summary:
- Invoice Number: ${data.invoiceNo}
- Amount: ₦${data.amount?.toLocaleString()}
- Due Date: ${data.dueDate}

Payment can be made at the billing department or via our online portal.

For inquiries, please contact billing@run.edu.ng

Best regards,
RUN Health Centre Billing
Redeemer's University, Nigeria
  `,
  custom: (data: Record<string, any>) => data.body || '',
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { to, subject, type, patientName, data = {} } = body

    // Validate required fields
    if (!to || !subject) {
      throw Errors.validation('Recipient and subject are required')
    }

    // Generate email content from template
    const emailBody = templates[type](data)

    // Log the email (in production, this would send via email service)
    logger.info('Email notification', { 
      to, 
      subject, 
      type,
      patientName 
    })

    // In production, you would integrate with an email service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll simulate success
    // When you have an email service, replace this with actual sending logic

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Store notification in a log
    const notificationLog = {
      id: `notif_${Date.now()}`,
      to,
      subject,
      type,
      patientName,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    return successResponse({
      message: 'Email notification sent successfully',
      data: notificationLog
    })

  } catch (error) {
    return errorResponse(error, { module: 'Notifications', operation: 'send' })
  }
}

export async function GET() {
  return successResponse({
    service: 'RUN Health Centre Email Notification Service',
    status: 'active',
    templates: Object.keys(templates),
    note: 'To enable actual email delivery, configure an email service provider (Resend, SendGrid, etc.)'
  })
}
