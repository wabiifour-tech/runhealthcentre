import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Notifications')

// Dynamically import Resend only when needed
let resend: any = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    // Dynamic import to avoid build-time errors
    const { Resend } = require('resend')
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// From email address - must be verified in Resend
const FROM_EMAIL = process.env.FROM_EMAIL || 'RUN Health Centre <noreply@runhealthcentre.vercel.app>'
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'runhealthcentre@run.edu.ng'

interface EmailRequest {
  to: string | string[]
  subject: string
  body?: string
  type: 'appointment' | 'lab_result' | 'prescription' | 'billing' | 'welcome' | 'queue' | 'discharge' | 'custom'
  patientName?: string
  data?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string // base64 encoded
    contentType: string
  }>
}

// HTML Email Templates with professional styling
const emailTemplates = {
  appointment: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏥 RUN Health Centre</h1>
        <p style="color: #e0e7ff; margin: 5px 0 0 0;">Redeemer's University, Ede</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Appointment Reminder</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          This is a reminder of your upcoming appointment at RUN Health Centre.
        </p>
        <!-- Appointment Details Card -->
        <table width="100%" style="background-color: #f8fafc; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="5">
                <tr>
                  <td style="color: #6b7280; width: 120px;">📅 Date:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.date || 'To be confirmed'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">🕐 Time:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.time || 'To be confirmed'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">🏥 Department:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.department || 'General'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">👨‍⚕️ Doctor:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.doctor || 'To be assigned'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            ⚠️ Please arrive 15 minutes before your scheduled time and bring your ID card.
          </p>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you need to reschedule, please contact us at <a href="mailto:${REPLY_TO}" style="color: #3b82f6;">${REPLY_TO}</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #1e3a8a; padding: 20px 30px; text-align: center;">
        <p style="color: #93c5fd; margin: 0; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #ffffff;">RUN Health Centre Team</strong>
        </p>
        <p style="color: #60a5fa; margin: 15px 0 0 0; font-size: 12px;">
          Redeemer's University, Ede, Osun State, Nigeria<br>
          📞 +234 806 566 4826
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  lab_result: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab Results Ready</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔬 Laboratory Results</h1>
        <p style="color: #d1fae5; margin: 5px 0 0 0;">RUN Health Centre</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #059669; margin-top: 0;">Lab Results Ready</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your laboratory test results are now available at RUN Health Centre.
        </p>
        <table width="100%" style="background-color: #ecfdf5; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="5">
                <tr>
                  <td style="color: #6b7280; width: 120px;">🧪 Test:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.testName || 'Laboratory Test'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">📋 Status:</td>
                  <td style="color: #059669; font-weight: 600;">Ready for collection</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Please visit the laboratory department to collect your results or consult with your doctor for interpretation.
        </p>
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            💡 Tip: Bring your ID card and payment receipt for easy collection.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #064e3b; padding: 20px 30px; text-align: center;">
        <p style="color: #6ee7b7; margin: 0; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #ffffff;">RUN Health Centre Laboratory</strong>
        </p>
        <p style="color: #34d399; margin: 15px 0 0 0; font-size: 12px;">
          Redeemer's University, Ede, Osun State, Nigeria
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  prescription: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription Ready</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed, #a78bfa); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💊 Pharmacy</h1>
        <p style="color: #ede9fe; margin: 5px 0 0 0;">RUN Health Centre</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #7c3aed; margin-top: 0;">Prescription Ready</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your prescription is ready for collection at the RUN Health Centre Pharmacy.
        </p>
        <table width="100%" style="background-color: #f5f3ff; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a78bfa;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="5">
                <tr>
                  <td style="color: #6b7280; width: 140px;">🆔 Prescription ID:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.prescriptionId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">📦 Items:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.items || 'Medications'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">⏰ Valid Until:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.expiryDate || '30 days'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            🕐 Pharmacy Hours: 8:00 AM - 6:00 PM (Monday - Friday)<br>
            📍 Location: RUN Health Centre, Ground Floor
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #4c1d95; padding: 20px 30px; text-align: center;">
        <p style="color: #c4b5fd; margin: 0; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #ffffff;">RUN Health Centre Pharmacy</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  billing: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💳 Payment Receipt</h1>
        <p style="color: #ffedd5; margin: 5px 0 0 0;">RUN Health Centre</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ea580c; margin-top: 0;">Payment Confirmation</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for your payment at RUN Health Centre.
        </p>
        <table width="100%" style="background-color: #fff7ed; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="5">
                <tr>
                  <td style="color: #6b7280; width: 140px;">🧾 Receipt No:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.receiptNo || data.invoiceNo || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">💵 Amount Paid:</td>
                  <td style="color: #059669; font-weight: 700; font-size: 18px;">₦${data.amount?.toLocaleString() || '0'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">📋 Service:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.service || data.description || 'Medical Services'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">📅 Date:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.date || new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">💳 Method:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.paymentMethod || 'Cash'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color: #dcfce7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #166534; margin: 0; font-size: 16px; font-weight: 600;">
            ✅ Payment Successful
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          For inquiries, please contact billing@run.edu.ng or visit our billing department.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #9a3412; padding: 20px 30px; text-align: center;">
        <p style="color: #fed7aa; margin: 0; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #ffffff;">RUN Health Centre Billing</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  welcome: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RUN Health Centre</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏥 Welcome!</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 18px;">RUN Health Centre</p>
        <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 14px;">Redeemer's University, Ede</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Welcome to RUN Health Centre!</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Welcome to RUN Health Centre! Your registration is complete. We're committed to providing you with excellent healthcare services.
        </p>
        <table width="100%" style="background-color: #eff6ff; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6;">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your Patient ID</p>
              <p style="color: #1e40af; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 2px;">
                ${data.ruhcCode || 'RUHC-XXXX'}
              </p>
            </td>
          </tr>
        </table>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Please save your Patient ID as you'll need it for all visits and to access your records.
        </p>
        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #166534; margin: 0 0 15px 0;">📋 What to bring for your visits:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Your Patient ID (${data.ruhcCode || 'RUHC-XXXX'})</li>
            <li style="margin-bottom: 8px;">Valid ID card (Staff/Student ID)</li>
            <li style="margin-bottom: 8px;">Health insurance card (if applicable)</li>
          </ul>
        </div>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">🕐 Working Hours</h3>
          <p style="color: #78350f; margin: 0; font-size: 14px;">
            Monday - Friday: 8:00 AM - 6:00 PM<br>
            Saturday: 9:00 AM - 2:00 PM<br>
            Emergency: 24/7
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1e3a8a; padding: 25px 30px; text-align: center;">
        <p style="color: #93c5fd; margin: 0; font-size: 14px;">
          We look forward to serving you!<br>
          <strong style="color: #ffffff;">RUN Health Centre Team</strong>
        </p>
        <p style="color: #60a5fa; margin: 15px 0 0 0; font-size: 12px;">
          📧 ${REPLY_TO} | 📞 +234 806 566 4826
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  queue: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Queue Update</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎯 Your Turn!</h1>
        <p style="color: #cffafe; margin: 5px 0 0 0;">Queue Notification</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <div style="background-color: #ecfeff; border-radius: 12px; padding: 30px; margin: 20px 0; border: 2px dashed #06b6d4;">
          <p style="color: #0891b2; margin: 0 0 10px 0; font-size: 14px;">Your Queue Number</p>
          <p style="color: #0e7490; font-size: 48px; font-weight: 700; margin: 0;">
            ${data.queueNumber || '#'}
          </p>
        </div>
        <p style="color: #dc2626; font-size: 20px; font-weight: 700; margin: 20px 0;">
          🔔 It's Your Turn NOW!
        </p>
        <div style="background-color: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #0369a1; margin: 0;">
            📍 Please proceed to <strong>${data.department || 'OPD'}</strong>
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #164e63; padding: 20px 30px; text-align: center;">
        <p style="color: #67e8f9; margin: 0; font-size: 14px;">
          RUN Health Centre<br>
          Redeemer's University, Ede
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  discharge: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discharge Summary</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏠 Discharge Summary</h1>
        <p style="color: #d1fae5; margin: 5px 0 0 0;">RUN Health Centre</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We're pleased to inform you that you have been discharged from RUN Health Centre. Please find your discharge summary below.
        </p>
        <table width="100%" style="background-color: #ecfdf5; border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="5">
                <tr>
                  <td style="color: #6b7280; width: 140px;">📅 Admission:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.admissionDate || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">📅 Discharge:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.dischargeDate || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">🩺 Diagnosis:</td>
                  <td style="color: #1f2937; font-weight: 600;">${data.diagnosis || 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">💊 Medications on Discharge:</h3>
          <p style="color: #78350f; margin: 0; white-space: pre-line;">${data.medications || 'As prescribed'}</p>
        </div>
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0;">📅 Follow-up:</h3>
          <p style="color: #1e3a8a; margin: 0;">${data.followUpDate || 'As needed'}</p>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          If you experience any complications, please return to the health centre immediately.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #064e3b; padding: 20px 30px; text-align: center;">
        <p style="color: #6ee7b7; margin: 0; font-size: 14px;">
          Wishing you a speedy recovery!<br>
          <strong style="color: #ffffff;">RUN Health Centre Team</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  custom: (data: Record<string, any>) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject || 'Notification'}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏥 RUN Health Centre</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Dear <strong>${data.patientName || 'Patient'}</strong>,
        </p>
        <div style="color: #374151; font-size: 16px; line-height: 1.6;">
          ${data.body || data.message || ''}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1e3a8a; padding: 20px 30px; text-align: center;">
        <p style="color: #93c5fd; margin: 0; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #ffffff;">RUN Health Centre Team</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Send email function
async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured - email will be logged only')
      return { success: true, messageId: `log_${Date.now()}` }
    }

    // Get Resend client (lazy initialization)
    const client = getResendClient()
    if (!client) {
      logger.warn('Resend client not initialized - email will be logged only')
      return { success: true, messageId: `log_${Date.now()}` }
    }

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      reply_to: REPLY_TO,
      attachments: params.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType
      }))
    })

    if (error) {
      logger.error('Email send error', error)
      return { success: false, error: error.message }
    }

    logger.info('Email sent successfully', { 
      to: params.to, 
      subject: params.subject,
      messageId: data?.id 
    })
    
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    logger.error('Email send exception', error)
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { to, subject, type, patientName, data = {}, attachments, body: emailBody } = body

    // Validate required fields
    if (!to || !subject) {
      throw Errors.validation('Recipient and subject are required')
    }

    // Prepare data for template
    const templateData = { ...data, patientName, body: emailBody }

    // Generate HTML content from template
    const html = emailTemplates[type](templateData)

    // Send email
    const result = await sendEmail({
      to,
      subject,
      html,
      attachments
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    // Log notification
    const notificationLog = {
      id: result.messageId || `notif_${Date.now()}`,
      to,
      subject,
      type,
      patientName,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    return successResponse({
      message: 'Email sent successfully',
      data: notificationLog
    })

  } catch (error) {
    return errorResponse(error, { module: 'Notifications', operation: 'send' })
  }
}

export async function GET() {
  return successResponse({
    service: 'RUN Health Centre Email Notification Service',
    status: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
    from: FROM_EMAIL,
    replyTo: REPLY_TO,
    templates: Object.keys(emailTemplates),
    note: process.env.RESEND_API_KEY 
      ? 'Email service is configured and ready to send emails.'
      : 'Set RESEND_API_KEY environment variable to enable email sending.'
  })
}
