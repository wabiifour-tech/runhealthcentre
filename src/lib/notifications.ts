// Notification Service - SMS and Email notifications for patients and staff
// Integrates with Brevo/SendGrid for emails and SMS gateway for text messages

export interface NotificationOptions {
  type: 'sms' | 'email' | 'both'
  recipient: string // phone number or email
  recipientName?: string
  subject?: string
  message: string
  template?: string
  variables?: Record<string, string>
  priority?: 'normal' | 'urgent'
  scheduledAt?: Date
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'sms' | 'email'
  subject?: string
  body: string
  variables: string[]
}

// Notification templates
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    type: 'sms',
    body: 'Dear {patientName}, this is a reminder of your appointment at RUN Health Centre on {date} at {time}. Please bring your ID card. Reply CANCEL to reschedule.',
    variables: ['patientName', 'date', 'time']
  },
  {
    id: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    type: 'sms',
    body: 'Your appointment at RUN Health Centre has been booked for {date} at {time} with Dr. {doctorName}. Reference: {appointmentId}',
    variables: ['patientName', 'date', 'time', 'doctorName', 'appointmentId']
  },
  {
    id: 'lab_result_ready',
    name: 'Lab Results Ready',
    type: 'sms',
    body: 'Dear {patientName}, your lab results are ready. Please visit RUN Health Centre to collect them or check online at runhealthcentre.vercel.app',
    variables: ['patientName']
  },
  {
    id: 'prescription_ready',
    name: 'Prescription Ready',
    type: 'sms',
    body: 'Dear {patientName}, your prescription is ready for pickup at RUN Health Centre Pharmacy. Valid until {expiryDate}.',
    variables: ['patientName', 'expiryDate']
  },
  {
    id: 'queue_update',
    name: 'Queue Position Update',
    type: 'sms',
    body: 'RUN Health Centre: You are #{position} in the queue. Estimated wait time: {waitTime} minutes.',
    variables: ['position', 'waitTime']
  },
  {
    id: 'queue_call',
    name: 'Queue Call',
    type: 'sms',
    body: 'RUN Health Centre: Your turn is NOW! Please proceed to {department}. Queue number: {queueNumber}',
    variables: ['department', 'queueNumber']
  },
  {
    id: 'payment_receipt',
    name: 'Payment Receipt',
    type: 'sms',
    body: 'RUN Health Centre: Payment of {amount} received for {service}. Receipt No: {receiptNo}. Thank you!',
    variables: ['amount', 'service', 'receiptNo']
  },
  {
    id: 'bill_reminder',
    name: 'Bill Reminder',
    type: 'sms',
    body: 'Dear {patientName}, you have an outstanding balance of {amount} at RUN Health Centre. Please clear to access services.',
    variables: ['patientName', 'amount']
  },
  {
    id: 'discharge_summary',
    name: 'Discharge Summary Ready',
    type: 'email',
    subject: 'Your Discharge Summary - RUN Health Centre',
    body: `Dear {patientName},

Your discharge summary from your recent admission at RUN Health Centre is ready.

Admission Date: {admissionDate}
Discharge Date: {dischargeDate}
Diagnosis: {diagnosis}

Please find the attached discharge summary document.

Follow-up appointments: {followUpDate}
Medications: Please continue your medications as prescribed.

For any questions, please contact us at 0800-RUN-HEALTH.

Best regards,
RUN Health Centre Medical Team`,
    variables: ['patientName', 'admissionDate', 'dischargeDate', 'diagnosis', 'followUpDate']
  },
  {
    id: 'medical_certificate',
    name: 'Medical Certificate',
    type: 'email',
    subject: 'Medical Certificate - RUN Health Centre',
    body: `Dear {patientName},

Please find attached your medical certificate.

This certifies that you were examined at RUN Health Centre on {date} and were found to be suffering from {condition}.

You are advised to rest for {days} days from {startDate} to {endDate}.

This certificate is valid for official purposes.

Best regards,
Dr. {doctorName}
RUN Health Centre`,
    variables: ['patientName', 'date', 'condition', 'days', 'startDate', 'endDate', 'doctorName']
  },
  {
    id: 'welcome_patient',
    name: 'Welcome New Patient',
    type: 'sms',
    body: 'Welcome to RUN Health Centre, {patientName}! Your patient ID is {ruhcCode}. Save this for all visits. Portal: runhealthcentre.vercel.app',
    variables: ['patientName', 'ruhcCode']
  },
  {
    id: 'vaccination_reminder',
    name: 'Vaccination Reminder',
    type: 'sms',
    body: 'RUN Health Centre: Reminder that {patientName} is due for {vaccineName} vaccination on {date}. Please visit the clinic.',
    variables: ['patientName', 'vaccineName', 'date']
  },
  {
    id: 'antenatal_reminder',
    name: 'Antenatal Reminder',
    type: 'sms',
    body: 'Dear {patientName}, your antenatal appointment is scheduled for {date} at {time}. Please come with your antenatal record book.',
    variables: ['patientName', 'date', 'time']
  }
]

// Send SMS notification
export async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Call the SMS API endpoint
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber, message })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`SMS sent to ${phoneNumber}: ${message.substring(0, 50)}...`)
      return { success: true, messageId: result.messageId }
    } else {
      console.error(`SMS failed to ${phoneNumber}:`, result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error('SMS sending error:', error)
    return { success: false, error: error.message }
  }
}

// Send email notification
export async function sendEmail(
  to: string | string[], 
  subject: string, 
  body: string, 
  options?: {
    type?: 'appointment' | 'lab_result' | 'prescription' | 'billing' | 'welcome' | 'queue' | 'discharge' | 'custom'
    patientName?: string
    data?: Record<string, any>
    attachments?: Array<{ filename: string; content: string; contentType: string }>
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        to, 
        subject, 
        body,
        type: options?.type || 'custom',
        patientName: options?.patientName,
        data: options?.data,
        attachments: options?.attachments
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`Email sent to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`)
      return { success: true, messageId: result.data?.id }
    } else {
      console.error(`Email failed to ${Array.isArray(to) ? to.join(', ') : to}:`, result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

// Send notification from template
export async function sendNotificationFromTemplate(
  templateId: string,
  recipient: string,
  variables: Record<string, string>,
  type: 'sms' | 'email' = 'sms'
): Promise<{ success: boolean; error?: string }> {
  const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId)
  
  if (!template) {
    return { success: false, error: 'Template not found' }
  }
  
  let message = template.body
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  
  if (type === 'sms' || template.type === 'sms') {
    return sendSMS(recipient, message)
  } else {
    return sendEmail(recipient, template.subject || 'Notification from RUN Health Centre', message)
  }
}

// Queue notification manager
interface QueuedNotification {
  id: string
  options: NotificationOptions
  status: 'pending' | 'sent' | 'failed'
  attempts: number
  lastAttempt?: Date
  error?: string
}

let notificationQueue: QueuedNotification[] = []

// Add to notification queue
export function queueNotification(options: NotificationOptions): string {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  notificationQueue.push({
    id,
    options,
    status: 'pending',
    attempts: 0
  })
  
  // Process queue
  processNotificationQueue()
  
  return id
}

// Process notification queue
async function processNotificationQueue(): Promise<void> {
  const pending = notificationQueue.filter(n => n.status === 'pending' && n.attempts < 3)
  
  for (const notification of pending) {
    notification.attempts++
    notification.lastAttempt = new Date()
    
    try {
      if (notification.options.type === 'sms' || notification.options.type === 'both') {
        const result = await sendSMS(notification.options.recipient, notification.options.message)
        notification.status = result.success ? 'sent' : 'failed'
        notification.error = result.error
      }
      
      if (notification.options.type === 'email' || notification.options.type === 'both') {
        const result = await sendEmail(
          notification.options.recipient,
          notification.options.subject || 'Notification from RUN Health Centre',
          notification.options.message
        )
        notification.status = result.success ? 'sent' : 'failed'
        notification.error = result.error
      }
    } catch (error: any) {
      notification.status = 'failed'
      notification.error = error.message
    }
  }
  
  // Clean up old sent notifications
  notificationQueue = notificationQueue.filter(n => 
    n.status === 'pending' || 
    (n.status === 'sent' && n.lastAttempt && Date.now() - n.lastAttempt.getTime() < 24 * 60 * 60 * 1000)
  )
}

// Get notification queue status
export function getNotificationQueueStatus(): {
  pending: number
  sent: number
  failed: number
} {
  return {
    pending: notificationQueue.filter(n => n.status === 'pending').length,
    sent: notificationQueue.filter(n => n.status === 'sent').length,
    failed: notificationQueue.filter(n => n.status === 'failed').length
  }
}

// Helper functions for common notifications

export function sendAppointmentReminder(
  patientPhone: string,
  patientName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('appointment_reminder', patientPhone, {
    patientName,
    date,
    time
  })
}

export function sendQueueUpdate(
  patientPhone: string,
  position: number,
  waitTime: number
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('queue_update', patientPhone, {
    position: String(position),
    waitTime: String(waitTime)
  })
}

export function sendQueueCall(
  patientPhone: string,
  department: string,
  queueNumber: number
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('queue_call', patientPhone, {
    department,
    queueNumber: String(queueNumber)
  })
}

export function sendPrescriptionReady(
  patientPhone: string,
  patientName: string,
  expiryDate: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('prescription_ready', patientPhone, {
    patientName,
    expiryDate
  })
}

export function sendPaymentReceipt(
  patientPhone: string,
  amount: string,
  service: string,
  receiptNo: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('payment_receipt', patientPhone, {
    amount,
    service,
    receiptNo
  })
}

export function sendWelcomeMessage(
  patientPhone: string,
  patientName: string,
  ruhcCode: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('welcome_patient', patientPhone, {
    patientName,
    ruhcCode
  })
}

export function sendLabResultNotification(
  patientPhone: string,
  patientName: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotificationFromTemplate('lab_result_ready', patientPhone, {
    patientName
  })
}

// Format phone number for SMS
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  
  // Add Nigeria country code if needed
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1)
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned
  }
  
  return cleaned
}
