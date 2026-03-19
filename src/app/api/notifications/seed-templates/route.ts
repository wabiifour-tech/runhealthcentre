// ============================================
// NOTIFICATION TEMPLATES SEED - Default Templates for HMS Events
// Run this once to populate notification_templates table
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('NotificationTemplatesSeed')

// Template definitions
const NOTIFICATION_TEMPLATES = [
  {
    name: 'patient_registered',
    type: 'patient_registered',
    category: 'patient',
    titleTemplate: 'New Patient Registered',
    messageTemplate: '{patientName} has been registered with RUHC Code: {ruhcCode}.',
    shortMessageTemplate: 'New patient: {patientName}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 72,
    targetRoles: ['ADMIN', 'RECORDS_OFFICER'],
    variables: ['patientName', 'ruhcCode']
  },
  {
    name: 'patient_admitted',
    type: 'patient_admitted',
    category: 'patient',
    titleTemplate: 'Patient Admitted',
    messageTemplate: '{patientName} has been admitted to {unit}. Bed: {bedNumber}',
    shortMessageTemplate: 'Patient admitted: {patientName}',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 48,
    targetRoles: ['ADMIN', 'MATRON', 'NURSE'],
    variables: ['patientName', 'unit', 'bedNumber']
  },
  {
    name: 'appointment_created',
    type: 'appointment_created',
    category: 'patient',
    titleTemplate: 'Appointment Scheduled',
    messageTemplate: 'Your appointment at RUHC is scheduled for {date} at {time}.',
    shortMessageTemplate: 'Appointment: {date} at {time}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'sms'],
    defaultExpiryHours: 168,
    variables: ['patientName', 'date', 'time', 'doctorName']
  },
  {
    name: 'appointment_reminder',
    type: 'appointment_reminder',
    category: 'patient',
    titleTemplate: 'Appointment Reminder',
    messageTemplate: 'Reminder: Your appointment is tomorrow ({date}) at {time}.',
    shortMessageTemplate: 'Reminder: Appointment {date}',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 24,
    variables: ['patientName', 'date', 'time']
  },
  {
    name: 'consultation_routed',
    type: 'consultation_routed',
    category: 'staff',
    titleTemplate: 'New Consultation Routed',
    messageTemplate: 'A consultation for patient {patientName} has been routed to you.',
    shortMessageTemplate: 'New consultation: {patientName}',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 24,
    variables: ['patientName', 'priority', 'senderName']
  },
  {
    name: 'lab_request_created',
    type: 'lab_request_created',
    category: 'lab',
    titleTemplate: 'New Lab Request',
    messageTemplate: 'Lab tests requested for patient {patientName}: {tests}.',
    shortMessageTemplate: 'Lab request: {tests}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 48,
    targetRoles: ['LAB_TECHNICIAN'],
    variables: ['patientName', 'tests', 'requestingDoctor']
  },
  {
    name: 'lab_result_ready',
    type: 'lab_result_ready',
    category: 'lab',
    titleTemplate: 'Lab Results Ready',
    messageTemplate: 'Lab results for {patientName} are now available.',
    shortMessageTemplate: 'Lab results ready',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 72,
    variables: ['patientName', 'testName']
  },
  {
    name: 'lab_result_critical',
    type: 'lab_result_critical',
    category: 'emergency',
    titleTemplate: 'CRITICAL Lab Result',
    messageTemplate: 'CRITICAL: Lab results for {patientName} require immediate attention!',
    shortMessageTemplate: 'CRITICAL: Lab result for {patientName}',
    defaultPriority: 'critical',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 24,
    targetRoles: ['DOCTOR', 'ADMIN', 'MATRON'],
    variables: ['patientName', 'testName', 'value']
  },
  {
    name: 'prescription_created',
    type: 'prescription_created',
    category: 'pharmacy',
    titleTemplate: 'New Prescription',
    messageTemplate: 'Prescription created for {patientName}.',
    shortMessageTemplate: 'New prescription for {patientName}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 72,
    targetRoles: ['PHARMACIST'],
    variables: ['patientName', 'medications', 'doctorName']
  },
  {
    name: 'prescription_ready',
    type: 'prescription_ready',
    category: 'pharmacy',
    titleTemplate: 'Prescription Ready',
    messageTemplate: 'Your prescription is ready for pickup at RUHC Pharmacy.',
    shortMessageTemplate: 'Prescription ready at RUHC',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'sms', 'push'],
    defaultExpiryHours: 168,
    variables: ['patientName', 'expiryDate']
  },
  {
    name: 'bill_generated',
    type: 'bill_generated',
    category: 'billing',
    titleTemplate: 'New Bill Generated',
    messageTemplate: 'A bill of NGN {amount} has been generated.',
    shortMessageTemplate: 'Bill: NGN {amount}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'sms'],
    defaultExpiryHours: 168,
    variables: ['patientName', 'amount', 'services']
  },
  {
    name: 'payment_received',
    type: 'payment_received',
    category: 'billing',
    titleTemplate: 'Payment Received',
    messageTemplate: 'Payment of NGN {amount} has been received. Receipt No: {receiptNo}',
    shortMessageTemplate: 'Payment received: NGN {amount}',
    defaultPriority: 'normal',
    defaultChannels: ['in-app', 'sms'],
    defaultExpiryHours: 72,
    variables: ['patientName', 'amount', 'receiptNo']
  },
  {
    name: 'queue_called',
    type: 'queue_called',
    category: 'patient',
    titleTemplate: 'It\'s Your Turn!',
    messageTemplate: 'Please proceed to {department} now. Queue number: #{queueNumber}',
    shortMessageTemplate: 'Your turn! Go to {department}',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 1,
    variables: ['patientName', 'department', 'queueNumber']
  },
  {
    name: 'staff_account_created',
    type: 'staff_account_created',
    category: 'staff',
    titleTemplate: 'New Staff Registration',
    messageTemplate: '{userName} ({role}) has registered and is awaiting approval.',
    shortMessageTemplate: 'New staff: {userName}',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'push'],
    defaultExpiryHours: 168,
    targetRoles: ['SUPER_ADMIN', 'ADMIN'],
    variables: ['userName', 'role', 'department']
  },
  {
    name: 'staff_account_approved',
    type: 'staff_account_approved',
    category: 'staff',
    titleTemplate: 'Account Approved',
    messageTemplate: 'Your RUHC staff account has been approved. You can now log in.',
    shortMessageTemplate: 'Your account is approved!',
    defaultPriority: 'high',
    defaultChannels: ['in-app', 'sms', 'email'],
    defaultExpiryHours: 168,
    variables: ['userName']
  },
  {
    name: 'emergency_admission',
    type: 'emergency_admission',
    category: 'emergency',
    titleTemplate: 'EMERGENCY ADMISSION',
    messageTemplate: 'EMERGENCY: Patient arriving at {location}. {description}',
    shortMessageTemplate: 'EMERGENCY at {location}',
    defaultPriority: 'critical',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 4,
    targetRoles: ['DOCTOR', 'NURSE', 'MATRON', 'ADMIN'],
    variables: ['patientName', 'location', 'description']
  },
  {
    name: 'critical_vitals',
    type: 'critical_vitals',
    category: 'emergency',
    titleTemplate: 'CRITICAL VITALS ALERT',
    messageTemplate: 'CRITICAL: Abnormal vitals detected for {patientName}.',
    shortMessageTemplate: 'Critical vitals: {patientName}',
    defaultPriority: 'critical',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 4,
    targetRoles: ['DOCTOR', 'NURSE', 'MATRON'],
    variables: ['patientName', 'vitalDetails', 'location']
  },
  {
    name: 'code_blue',
    type: 'code_blue',
    category: 'emergency',
    titleTemplate: 'CODE BLUE',
    messageTemplate: 'CODE BLUE: Cardiac emergency for {patientName} at {location}.',
    shortMessageTemplate: 'CODE BLUE at {location}',
    defaultPriority: 'critical',
    defaultChannels: ['in-app', 'push', 'sms'],
    defaultExpiryHours: 1,
    targetRoles: ['DOCTOR', 'NURSE', 'MATRON', 'ADMIN'],
    variables: ['patientName', 'location']
  }
]

async function seedTemplates() {
  try {
    const pool = getPool()
    let count = 0

    for (const template of NOTIFICATION_TEMPLATES) {
      const existingResult = await pool.query(
        `SELECT id FROM notification_templates WHERE name = $1`,
        [template.name]
      )

      if (existingResult.rows.length > 0) {
        await pool.query(`
          UPDATE notification_templates SET
            type = $2, category = $3, "titleTemplate" = $4, "messageTemplate" = $5,
            "shortMessageTemplate" = $6, "defaultPriority" = $7, "defaultChannels" = $8,
            "defaultExpiryHours" = $9, "targetRoles" = $10, variables = $11,
            "isActive" = true, "updatedAt" = NOW()
          WHERE name = $1
        `, [
          template.name, template.type, template.category, template.titleTemplate,
          template.messageTemplate, template.shortMessageTemplate, template.defaultPriority,
          JSON.stringify(template.defaultChannels), template.defaultExpiryHours,
          template.targetRoles ? JSON.stringify(template.targetRoles) : null,
          JSON.stringify(template.variables)
        ])
      } else {
        const id = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await pool.query(`
          INSERT INTO notification_templates (
            id, name, type, category, "titleTemplate", "messageTemplate",
            "shortMessageTemplate", "defaultPriority", "defaultChannels",
            "defaultExpiryHours", "targetRoles", variables, "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
        `, [
          id, template.name, template.type, template.category, template.titleTemplate,
          template.messageTemplate, template.shortMessageTemplate, template.defaultPriority,
          JSON.stringify(template.defaultChannels), template.defaultExpiryHours,
          template.targetRoles ? JSON.stringify(template.targetRoles) : null,
          JSON.stringify(template.variables)
        ])
      }
      count++
    }

    logger.info(`Seeded ${count} notification templates`)
    return { success: true, count }
  } catch (error: any) {
    logger.error('Failed to seed notification templates', { error: error.message })
    return { success: false, count: 0, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  const result = await seedTemplates()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function GET(request: NextRequest) {
  try {
    const pool = getPool()
    const result = await pool.query(`
      SELECT * FROM notification_templates WHERE "isActive" = true ORDER BY category, type
    `)
    return NextResponse.json({ success: true, templates: result.rows })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
