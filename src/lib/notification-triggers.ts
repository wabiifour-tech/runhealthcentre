// ============================================
// NOTIFICATION TRIGGERS - HMS Event Integration
// Call these functions from API routes when events occur
// ============================================

import { notify, NotificationTrigger } from './notification-engine'
import { broadcast } from './realtime-context'
import { processNotificationQueue } from './notification-worker'
import { createLogger } from './logger'

const logger = createLogger('NotificationTriggers')

// ============================================
// PATIENT EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a new patient is registered
 * Call from: /api/patients POST handler
 */
export async function onPatientRegistered(params: {
  patientId: string
  patientName: string
  ruhcCode: string
  patientPhone?: string
  patientEmail?: string
  registeredBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'patient_registered',
      data: {
        patientId: params.patientId,
        ruhcCode: params.ruhcCode
      },
      actor: params.registeredBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: params.ruhcCode,
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('patients_updated', { patientId: params.patientId })
    await processNotificationQueue()

    logger.info(`Patient registered notification sent for ${params.patientName}`)

  } catch (error: any) {
    logger.error('Failed to send patient registration notification', { error: error.message })
  }
}

/**
 * Trigger notification when a patient is admitted
 */
export async function onPatientAdmitted(params: {
  patientId: string
  patientName: string
  ruhcCode: string
  unit: string
  bedNumber?: number
  admittedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'patient_admitted',
      data: {
        patientId: params.patientId,
        unit: params.unit,
        bedNumber: params.bedNumber
      },
      actor: params.admittedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: params.ruhcCode
      }
    }

    await notify(trigger)
    await broadcast('admissions_updated', { patientId: params.patientId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send patient admission notification', { error: error.message })
  }
}

/**
 * Trigger notification when a patient is discharged
 */
export async function onPatientDischarged(params: {
  patientId: string
  patientName: string
  ruhcCode: string
  patientPhone?: string
  patientEmail?: string
  dischargedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'patient_discharged',
      data: { patientId: params.patientId },
      actor: params.dischargedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: params.ruhcCode,
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('admissions_updated', { patientId: params.patientId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send patient discharge notification', { error: error.message })
  }
}

// ============================================
// APPOINTMENT EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when an appointment is created
 */
export async function onAppointmentCreated(params: {
  appointmentId: string
  patientId: string
  patientName: string
  patientPhone?: string
  patientEmail?: string
  doctorId?: string
  doctorName?: string
  date: string
  time: string
  createdBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'appointment_created',
      data: {
        appointmentId: params.appointmentId,
        patientId: params.patientId,
        doctorId: params.doctorId,
        date: params.date,
        time: params.time
      },
      actor: params.createdBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('appointments_updated', { appointmentId: params.appointmentId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send appointment notification', { error: error.message })
  }
}

/**
 * Trigger appointment reminder notification
 */
export async function onAppointmentReminder(params: {
  appointmentId: string
  patientId: string
  patientName: string
  patientPhone: string
  doctorName?: string
  date: string
  time: string
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'appointment_reminder',
      data: {
        appointmentId: params.appointmentId,
        date: params.date,
        time: params.time,
        doctorName: params.doctorName
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send appointment reminder', { error: error.message })
  }
}

// ============================================
// CONSULTATION EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a consultation is routed
 */
export async function onConsultationRouted(params: {
  consultationId: string
  patientId: string
  patientName: string
  recipientId: string
  recipientName: string
  recipientRole: string
  routedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'consultation_routed',
      data: {
        consultationId: params.consultationId,
        patientId: params.patientId,
        recipientId: params.recipientId
      },
      actor: params.routedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: ''
      }
    }

    await notify(trigger)
    await broadcast('consultations_updated', { consultationId: params.consultationId })
    await broadcast('routing_updated', { recipientId: params.recipientId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send consultation routed notification', { error: error.message })
  }
}

// ============================================
// LAB EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a lab request is created
 */
export async function onLabRequestCreated(params: {
  requestId: string
  patientId: string
  patientName: string
  patientPhone?: string
  requestedBy?: {
    id: string
    name: string
    role: string
  }
  tests?: string[]
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'lab_request_created',
      data: {
        requestId: params.requestId,
        patientId: params.patientId,
        tests: params.tests
      },
      actor: params.requestedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await broadcast('lab_requests_updated', { requestId: params.requestId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send lab request notification', { error: error.message })
  }
}

/**
 * Trigger notification when lab results are ready
 */
export async function onLabResultReady(params: {
  resultId: string
  requestId: string
  patientId: string
  patientName: string
  patientPhone?: string
  patientEmail?: string
  doctorId?: string
  testName?: string
  isCritical?: boolean
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: params.isCritical ? 'lab_result_critical' : 'lab_result_ready',
      data: {
        resultId: params.resultId,
        requestId: params.requestId,
        patientId: params.patientId,
        doctorId: params.doctorId,
        testName: params.testName
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('lab_results_updated', { resultId: params.resultId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send lab result notification', { error: error.message })
  }
}

// ============================================
// PRESCRIPTION EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a prescription is created
 */
export async function onPrescriptionCreated(params: {
  prescriptionId: string
  patientId: string
  patientName: string
  patientPhone?: string
  prescribedBy?: {
    id: string
    name: string
    role: string
  }
  medications?: string[]
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'prescription_created',
      data: {
        prescriptionId: params.prescriptionId,
        patientId: params.patientId,
        medications: params.medications
      },
      actor: params.prescribedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await broadcast('prescriptions_updated', { prescriptionId: params.prescriptionId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send prescription notification', { error: error.message })
  }
}

/**
 * Trigger notification when a prescription is ready
 */
export async function onPrescriptionReady(params: {
  prescriptionId: string
  patientId: string
  patientName: string
  patientPhone: string
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'prescription_ready',
      data: {
        prescriptionId: params.prescriptionId,
        patientId: params.patientId
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send prescription ready notification', { error: error.message })
  }
}

// ============================================
// BILLING EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a bill is generated
 */
export async function onBillGenerated(params: {
  billId: string
  patientId: string
  patientName: string
  patientPhone?: string
  patientEmail?: string
  amount: number
  services?: string[]
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'bill_generated',
      data: {
        billId: params.billId,
        patientId: params.patientId,
        amount: params.amount,
        services: params.services
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('wallet_updated', { patientId: params.patientId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send bill notification', { error: error.message })
  }
}

/**
 * Trigger notification when payment is received
 */
export async function onPaymentReceived(params: {
  paymentId: string
  patientId: string
  patientName: string
  patientPhone?: string
  patientEmail?: string
  amount: number
  receiptNo?: string
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'payment_received',
      data: {
        paymentId: params.paymentId,
        patientId: params.patientId,
        amount: params.amount,
        receiptNo: params.receiptNo
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone,
        email: params.patientEmail
      }
    }

    await notify(trigger)
    await broadcast('payments_updated', { paymentId: params.paymentId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send payment notification', { error: error.message })
  }
}

// ============================================
// QUEUE EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a patient joins the queue
 */
export async function onQueueJoined(params: {
  queueId: string
  patientId: string
  patientName: string
  patientPhone?: string
  position: number
  unit: string
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'queue_joined',
      data: {
        queueId: params.queueId,
        patientId: params.patientId,
        position: params.position,
        unit: params.unit
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await broadcast('queue_updated', { queueId: params.queueId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send queue joined notification', { error: error.message })
  }
}

/**
 * Trigger notification when it's a patient's turn
 */
export async function onQueueCalled(params: {
  queueId: string
  patientId: string
  patientName: string
  patientPhone: string
  queueNumber: number
  department: string
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'queue_called',
      data: {
        queueId: params.queueId,
        patientId: params.patientId,
        queueNumber: params.queueNumber,
        department: params.department
      },
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: '',
        phone: params.patientPhone
      }
    }

    await notify(trigger)
    await broadcast('queue_updated', { queueId: params.queueId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send queue called notification', { error: error.message })
  }
}

// ============================================
// STAFF EVENT TRIGGERS
// ============================================

/**
 * Trigger notification when a new staff account is created
 */
export async function onStaffAccountCreated(params: {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  registeredBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'staff_account_created',
      data: {
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole
      },
      actor: params.registeredBy
    }

    await notify(trigger)
    await broadcast('staff_updated', { userId: params.userId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send staff account notification', { error: error.message })
  }
}

/**
 * Trigger notification when a staff account is approved
 */
export async function onStaffAccountApproved(params: {
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  approvedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'staff_account_approved',
      data: {
        userId: params.userId
      },
      actor: params.approvedBy
    }

    await notify(trigger)
    await broadcast('staff_updated', { userId: params.userId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send staff approval notification', { error: error.message })
  }
}

// ============================================
// EMERGENCY EVENT TRIGGERS
// ============================================

/**
 * Trigger notification for emergency admission
 */
export async function onEmergencyAdmission(params: {
  patientId: string
  patientName: string
  location?: string
  description?: string
  admittedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'emergency_admission',
      data: {
        patientId: params.patientId,
        location: params.location,
        description: params.description
      },
      actor: params.admittedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: ''
      }
    }

    await notify(trigger)
    await broadcast('notifications_updated', { priority: 'critical' })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send emergency notification', { error: error.message })
  }
}

/**
 * Trigger notification for critical vitals
 */
export async function onCriticalVitals(params: {
  patientId: string
  patientName: string
  vitals: Record<string, any>
  recordedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'critical_vitals',
      data: {
        patientId: params.patientId,
        vitals: params.vitals
      },
      actor: params.recordedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: ''
      }
    }

    await notify(trigger)
    await broadcast('vitals_updated', { patientId: params.patientId })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send critical vitals notification', { error: error.message })
  }
}

/**
 * Trigger Code Blue alert
 */
export async function onCodeBlue(params: {
  patientId: string
  patientName: string
  location: string
  activatedBy?: {
    id: string
    name: string
    role: string
  }
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'code_blue',
      data: {
        patientId: params.patientId,
        location: params.location
      },
      actor: params.activatedBy,
      patient: {
        id: params.patientId,
        name: params.patientName,
        ruhcCode: ''
      }
    }

    await notify(trigger)
    await broadcast('notifications_updated', { priority: 'critical', type: 'code_blue' })
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send Code Blue notification', { error: error.message })
  }
}

// ============================================
// SYSTEM EVENT TRIGGERS
// ============================================

/**
 * Trigger system alert notification
 */
export async function onSystemAlert(params: {
  title: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  targetRoles?: string[]
}): Promise<void> {
  try {
    const trigger: NotificationTrigger = {
      event: 'system_alert',
      data: {
        title: params.title,
        message: params.message,
        targetRoles: params.targetRoles
      }
    }

    await notify(trigger)
    await broadcast('notifications_updated', {})
    await processNotificationQueue()

  } catch (error: any) {
    logger.error('Failed to send system alert', { error: error.message })
  }
}
