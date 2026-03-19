// Notification Routing Engine - Smart role-based notification routing
// Determines who receives which notifications based on hospital events

import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  RoutingRule,
  RecipientRule,
  NotificationTrigger
} from './notification-types'
import { getPool } from './db'

// ============================================
// ROUTING RULES CONFIGURATION
// ============================================

const ROUTING_RULES: Record<NotificationType, RoutingRule> = {
  // Patient Events
  patient_registered: {
    eventType: 'patient_registered',
    recipients: [
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] },
      { type: 'role', value: 'RECORDS_OFFICER', channels: ['in-app'] },
      { type: 'related', value: 'patient', channels: ['sms'] } // Welcome SMS to patient
    ],
    channels: ['in-app', 'push'],
    priority: 'normal'
  },
  patient_admitted: {
    eventType: 'patient_admitted',
    recipients: [
      { type: 'role', value: 'ADMIN', channels: ['in-app'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push'] },
      { type: 'department', value: 'ward', channels: ['in-app'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'high'
  },
  patient_discharged: {
    eventType: 'patient_discharged',
    recipients: [
      { type: 'role', value: 'ADMIN', channels: ['in-app'] },
      { type: 'role', value: 'RECORDS_OFFICER', channels: ['in-app'] },
      { type: 'related', value: 'patient', channels: ['sms', 'email'] }
    ],
    channels: ['in-app', 'sms', 'email'],
    priority: 'normal'
  },
  patient_transferred: {
    eventType: 'patient_transferred',
    recipients: [
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] },
      { type: 'department', value: 'destination', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'high'
  },

  // Appointment Events
  appointment_created: {
    eventType: 'appointment_created',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'related', value: 'doctor', channels: ['in-app', 'push'] },
      { type: 'role', value: 'RECORDS_OFFICER', channels: ['in-app'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'normal'
  },
  appointment_confirmed: {
    eventType: 'appointment_confirmed',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'related', value: 'doctor', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  appointment_reminder: {
    eventType: 'appointment_reminder',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'push'] },
      { type: 'related', value: 'doctor', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms', 'push'],
    priority: 'high'
  },
  appointment_cancelled: {
    eventType: 'appointment_cancelled',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'related', value: 'doctor', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  appointment_rescheduled: {
    eventType: 'appointment_rescheduled',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'related', value: 'doctor', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },

  // Consultation Events
  consultation_started: {
    eventType: 'consultation_started',
    recipients: [
      { type: 'role', value: 'NURSE', channels: ['in-app'] },
      { type: 'role', value: 'RECORDS_OFFICER', channels: ['in-app'] }
    ],
    channels: ['in-app'],
    priority: 'normal'
  },
  consultation_completed: {
    eventType: 'consultation_completed',
    recipients: [
      { type: 'role', value: 'RECORDS_OFFICER', channels: ['in-app'] },
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  consultation_routed: {
    eventType: 'consultation_routed',
    recipients: [
      { type: 'related', value: 'recipient', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'high'
  },
  consultation_sent_back: {
    eventType: 'consultation_sent_back',
    recipients: [
      { type: 'related', value: 'recipient', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'high'
  },

  // Lab Events
  lab_request_created: {
    eventType: 'lab_request_created',
    recipients: [
      { type: 'role', value: 'LAB_TECHNICIAN', channels: ['in-app', 'push'] },
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'normal'
  },
  lab_sample_collected: {
    eventType: 'lab_sample_collected',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  lab_result_ready: {
    eventType: 'lab_result_ready',
    recipients: [
      { type: 'related', value: 'doctor', channels: ['in-app', 'push'] },
      { type: 'related', value: 'patient', channels: ['sms', 'email'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'high'
  },
  lab_result_critical: {
    eventType: 'lab_result_critical',
    recipients: [
      { type: 'related', value: 'doctor', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  },

  // Prescription Events
  prescription_created: {
    eventType: 'prescription_created',
    recipients: [
      { type: 'role', value: 'PHARMACIST', channels: ['in-app', 'push'] },
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'normal'
  },
  prescription_ready: {
    eventType: 'prescription_ready',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'push'] }
    ],
    channels: ['in-app', 'sms', 'push'],
    priority: 'high'
  },
  prescription_dispensed: {
    eventType: 'prescription_dispensed',
    recipients: [
      { type: 'related', value: 'doctor', channels: ['in-app'] },
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  prescription_cancelled: {
    eventType: 'prescription_cancelled',
    recipients: [
      { type: 'role', value: 'PHARMACIST', channels: ['in-app'] }
    ],
    channels: ['in-app'],
    priority: 'normal'
  },

  // Billing Events
  bill_generated: {
    eventType: 'bill_generated',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms', 'email'],
    priority: 'normal'
  },
  payment_received: {
    eventType: 'payment_received',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  payment_reminder: {
    eventType: 'payment_reminder',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] }
    ],
    channels: ['sms', 'email'],
    priority: 'normal'
  },
  refund_processed: {
    eventType: 'refund_processed',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'email'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },

  // Queue Events
  queue_joined: {
    eventType: 'queue_joined',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms'] },
      { type: 'role', value: 'NURSE', channels: ['in-app'] }
    ],
    channels: ['in-app', 'sms'],
    priority: 'normal'
  },
  queue_called: {
    eventType: 'queue_called',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms', 'push'] }
    ],
    channels: ['sms', 'push'],
    priority: 'high'
  },
  queue_position_update: {
    eventType: 'queue_position_update',
    recipients: [
      { type: 'related', value: 'patient', channels: ['sms'] }
    ],
    channels: ['sms'],
    priority: 'low'
  },

  // Staff Events
  staff_account_created: {
    eventType: 'staff_account_created',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'push'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'high'
  },
  staff_account_approved: {
    eventType: 'staff_account_approved',
    recipients: [
      { type: 'related', value: 'user', channels: ['sms', 'email'] }
    ],
    channels: ['sms', 'email', 'in-app'],
    priority: 'high'
  },
  staff_account_rejected: {
    eventType: 'staff_account_rejected',
    recipients: [
      { type: 'related', value: 'user', channels: ['email'] }
    ],
    channels: ['email'],
    priority: 'normal'
  },
  shift_assigned: {
    eventType: 'shift_assigned',
    recipients: [
      { type: 'related', value: 'user', channels: ['in-app', 'push', 'sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'normal'
  },
  shift_swapped: {
    eventType: 'shift_swapped',
    recipients: [
      { type: 'related', value: 'user', channels: ['in-app', 'push'] },
      { type: 'role', value: 'MATRON', channels: ['in-app'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'normal'
  },

  // System Events
  system_alert: {
    eventType: 'system_alert',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'high'
  },
  system_maintenance: {
    eventType: 'system_maintenance',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'push'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push'],
    priority: 'normal'
  },
  security_alert: {
    eventType: 'security_alert',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'push', 'sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  },
  daily_report: {
    eventType: 'daily_report',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'email'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'email'] }
    ],
    channels: ['in-app', 'email'],
    priority: 'low'
  },

  // Emergency Events
  emergency_admission: {
    eventType: 'emergency_admission',
    recipients: [
      { type: 'role', value: 'DOCTOR', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push'] },
      { type: 'role', value: 'NURSE', channels: ['in-app', 'push'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  },
  critical_vitals: {
    eventType: 'critical_vitals',
    recipients: [
      { type: 'role', value: 'DOCTOR', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push'] },
      { type: 'role', value: 'NURSE', channels: ['in-app', 'push', 'sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  },
  code_blue: {
    eventType: 'code_blue',
    recipients: [
      { type: 'role', value: 'DOCTOR', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'NURSE', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  },
  code_red: {
    eventType: 'code_red',
    recipients: [
      { type: 'role', value: 'SUPER_ADMIN', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'ADMIN', channels: ['in-app', 'push', 'sms'] },
      { type: 'role', value: 'MATRON', channels: ['in-app', 'push', 'sms'] }
    ],
    channels: ['in-app', 'push', 'sms'],
    priority: 'critical'
  }
}

// ============================================
// ROUTING ENGINE CLASS
// ============================================

export class NotificationRouter {
  private pool: any

  constructor() {
    this.pool = getPool()
  }

  /**
   * Get routing rule for a notification type
   */
  getRoutingRule(type: NotificationType): RoutingRule | undefined {
    return ROUTING_RULES[type]
  }

  /**
   * Resolve recipients based on trigger and routing rules
   */
  async resolveRecipients(trigger: NotificationTrigger): Promise<ResolvedRecipient[]> {
    const rule = ROUTING_RULES[trigger.event]
    if (!rule) {
      console.warn(`No routing rule found for event: ${trigger.event}`)
      return []
    }

    const recipients: ResolvedRecipient[] = []

    for (const recipientRule of rule.recipients) {
      const resolved = await this.resolveRecipientRule(recipientRule, trigger)
      recipients.push(...resolved)
    }

    // Deduplicate by userId
    const uniqueRecipients = this.deduplicateRecipients(recipients)

    return uniqueRecipients
  }

  /**
   * Resolve a single recipient rule
   */
  private async resolveRecipientRule(
    rule: RecipientRule, 
    trigger: NotificationTrigger
  ): Promise<ResolvedRecipient[]> {
    const recipients: ResolvedRecipient[] = []

    switch (rule.type) {
      case 'role':
        // Get all users with the specified role
        const roleUsers = await this.getUsersByRole(rule.value)
        recipients.push(...roleUsers.map(user => ({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          channels: rule.channels || ['in-app'],
          isRelated: false
        })))
        break

      case 'department':
        // Get all users in the department
        const deptUsers = await this.getUsersByDepartment(rule.value)
        recipients.push(...deptUsers.map(user => ({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          channels: rule.channels || ['in-app'],
          isRelated: false
        })))
        break

      case 'related':
        // Get related entity (patient, doctor, etc.)
        const related = await this.getRelatedEntity(rule.value, trigger)
        if (related) {
          recipients.push({
            userId: related.id,
            userName: related.name,
            userRole: related.role,
            phone: related.phone,
            email: related.email,
            channels: rule.channels || ['in-app'],
            isRelated: true
          })
        }
        break

      case 'user':
        // Direct user reference
        const user = await this.getUserById(rule.value)
        if (user) {
          recipients.push({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            phone: user.phone,
            email: user.email,
            channels: rule.channels || ['in-app'],
            isRelated: false
          })
        }
        break
    }

    return recipients
  }

  /**
   * Get users by role
   */
  private async getUsersByRole(role: string): Promise<Array<{id: string, name: string, role: string}>> {
    try {
      const result = await this.pool.query(
        `SELECT id, name, role FROM users WHERE role = $1 AND "isActive" = true`,
        [role]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching users by role:', error)
      return []
    }
  }

  /**
   * Get users by department
   */
  private async getUsersByDepartment(department: string): Promise<Array<{id: string, name: string, role: string}>> {
    try {
      const result = await this.pool.query(
        `SELECT id, name, role FROM users WHERE department ILIKE $1 AND "isActive" = true`,
        [`%${department}%`]
      )
      return result.rows
    } catch (error) {
      console.error('Error fetching users by department:', error)
      return []
    }
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<{id: string, name: string, role: string, phone?: string, email?: string} | null> {
    try {
      const result = await this.pool.query(
        `SELECT id, name, role, phone, email FROM users WHERE id = $1`,
        [userId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  /**
   * Get related entity from trigger data
   */
  private async getRelatedEntity(
    entityType: string, 
    trigger: NotificationTrigger
  ): Promise<{id: string, name: string, role?: string, phone?: string, email?: string} | null> {
    const { data, actor, patient } = trigger

    switch (entityType) {
      case 'patient':
        if (patient) {
          return {
            id: patient.id,
            name: patient.name,
            role: 'PATIENT',
            phone: patient.phone,
            email: patient.email
          }
        }
        if (data.patientId) {
          const patientData = await this.getPatientById(data.patientId)
          if (patientData) {
            return {
              id: patientData.id,
              name: `${patientData.firstName} ${patientData.lastName}`,
              role: 'PATIENT',
              phone: patientData.phone,
              email: patientData.email
            }
          }
        }
        break

      case 'doctor':
        if (data.doctorId) {
          return this.getUserById(data.doctorId)
        }
        break

      case 'recipient':
        // For routed consultations/messages
        if (data.recipientId) {
          return this.getUserById(data.recipientId)
        }
        break

      case 'user':
        if (data.userId) {
          return this.getUserById(data.userId)
        }
        if (actor) {
          return {
            id: actor.id,
            name: actor.name,
            role: actor.role
          }
        }
        break

      case 'sender':
        if (actor) {
          return {
            id: actor.id,
            name: actor.name,
            role: actor.role
          }
        }
        break
    }

    return null
  }

  /**
   * Get patient by ID
   */
  private async getPatientById(patientId: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT id, "firstName", "lastName", phone, email FROM patients WHERE id = $1`,
        [patientId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error fetching patient:', error)
      return null
    }
  }

  /**
   * Deduplicate recipients by userId
   */
  private deduplicateRecipients(recipients: ResolvedRecipient[]): ResolvedRecipient[] {
    const map = new Map<string, ResolvedRecipient>()
    
    for (const recipient of recipients) {
      const existing = map.get(recipient.userId)
      if (!existing) {
        map.set(recipient.userId, recipient)
      } else {
        // Merge channels
        const mergedChannels = [...new Set([...existing.channels, ...recipient.channels])]
        existing.channels = mergedChannels as NotificationChannel[]
      }
    }

    return Array.from(map.values())
  }

  /**
   * Get default priority for event type
   */
  getDefaultPriority(type: NotificationType): NotificationPriority {
    const rule = ROUTING_RULES[type]
    return rule?.priority || 'normal'
  }

  /**
   * Get default channels for event type
   */
  getDefaultChannels(type: NotificationType): NotificationChannel[] {
    const rule = ROUTING_RULES[type]
    return rule?.channels || ['in-app']
  }
}

// ============================================
// TYPES
// ============================================

export interface ResolvedRecipient {
  userId: string
  userName: string
  userRole?: string
  phone?: string
  email?: string
  channels: NotificationChannel[]
  isRelated: boolean
}

// Export singleton instance
export const notificationRouter = new NotificationRouter()
