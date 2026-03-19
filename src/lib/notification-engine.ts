// ============================================
// NOTIFICATION ENGINE - WhatsApp-Style Notification System
// Complete notification creation, routing, and delivery
// ============================================

import { getPool } from './db'
import { notificationRouter, ResolvedRecipient } from './notification-router'
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationStatus,
  NotificationCategory,
  Notification,
  NotificationTrigger,
  CreateNotificationRequest
} from './notification-types'
import { createLogger } from './logger'

const logger = createLogger('NotificationEngine')

// ============================================
// NOTIFICATION ENGINE CLASS
// ============================================

export class NotificationEngine {
  private pool: any
  private static instance: NotificationEngine

  private constructor() {
    this.pool = getPool()
  }

  static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine()
    }
    return NotificationEngine.instance
  }

  // ============================================
  // MAIN NOTIFICATION CREATION METHOD
  // ============================================

  /**
   * Create and dispatch a notification based on a hospital event
   * This is the primary entry point for all notifications
   */
  async createFromTrigger(trigger: NotificationTrigger): Promise<{
    success: boolean
    notificationId?: string
    recipients?: number
    error?: string
  }> {
    try {
      // 1. Resolve recipients using the routing engine
      const recipients = await notificationRouter.resolveRecipients(trigger)
      
      if (recipients.length === 0) {
        logger.warn(`No recipients resolved for event: ${trigger.event}`)
        return { success: true, notificationId: undefined, recipients: 0 }
      }

      // 2. Get routing rule for priority and channels
      const rule = notificationRouter.getRoutingRule(trigger.event)
      const priority = rule?.priority || 'normal'
      const channels = rule?.channels || ['in-app']

      // 3. Build notification content
      const { title, message, category } = await this.buildNotificationContent(trigger)

      // 4. Create the main notification record
      const notificationId = await this.createNotificationRecord({
        type: trigger.event,
        category,
        title,
        message,
        priority,
        channels,
        data: trigger.data,
        senderId: trigger.actor?.id,
        senderName: trigger.actor?.name,
        senderRole: trigger.actor?.role,
        actionUrl: this.buildActionUrl(trigger)
      })

      // 5. Create recipient records for each user
      await this.createRecipientRecords(notificationId, recipients)

      // 6. Queue delivery for each channel
      await this.queueDelivery(notificationId, channels, recipients, priority)

      // 7. Log the notification creation
      await this.logNotificationAction(notificationId, 'created', 'success')

      logger.info(`Notification created: ${notificationId} for ${recipients.length} recipients`)

      return {
        success: true,
        notificationId,
        recipients: recipients.length
      }

    } catch (error: any) {
      logger.error('Failed to create notification from trigger', { error: error.message, event: trigger.event })
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a direct notification (not from a trigger)
   */
  async createDirect(request: CreateNotificationRequest): Promise<{
    success: boolean
    notificationId?: string
    error?: string
  }> {
    try {
      const notificationId = await this.createNotificationRecord({
        ...request,
        category: request.category || 'general'
      })

      // If specific userId, create recipient record
      if (request.userId) {
        await this.pool.query(`
          INSERT INTO notification_recipients (id, "notificationId", "userId", status, "createdAt")
          VALUES ($1, $2, $3, 'pending', NOW())
        `, [`nr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, notificationId, request.userId])
      }

      // Queue delivery
      const channels = request.channels || ['in-app']
      await this.queueDelivery(notificationId, channels, [{
        userId: request.userId!,
        userName: '',
        channels
      }], request.priority || 'normal')

      await this.logNotificationAction(notificationId, 'created', 'success')

      return { success: true, notificationId }

    } catch (error: any) {
      logger.error('Failed to create direct notification', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // NOTIFICATION RECORD MANAGEMENT
  // ============================================

  private async createNotificationRecord(params: {
    type: NotificationType | string
    category: NotificationCategory | string
    title: string
    message: string
    priority: NotificationPriority | string
    channels: NotificationChannel[]
    data?: Record<string, any>
    senderId?: string
    senderName?: string
    senderRole?: string
    actionUrl?: string
    userId?: string
    targetRoles?: string[]
    targetDepartments?: string[]
  }): Promise<string> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await this.pool.query(`
      INSERT INTO notifications (
        id, type, category, title, message, priority, channels,
        data, "senderId", "senderName", "senderRole", "actionUrl",
        "userId", "targetRoles", "targetDepartments",
        status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW(), NOW())
    `, [
      id,
      params.type,
      params.category,
      params.title,
      params.message,
      params.priority,
      JSON.stringify(params.channels),
      params.data ? JSON.stringify(params.data) : null,
      params.senderId || null,
      params.senderName || null,
      params.senderRole || null,
      params.actionUrl || null,
      params.userId || null,
      params.targetRoles ? JSON.stringify(params.targetRoles) : null,
      params.targetDepartments ? JSON.stringify(params.targetDepartments) : null
    ])

    return id
  }

  private async createRecipientRecords(notificationId: string, recipients: ResolvedRecipient[]): Promise<void> {
    const values = recipients.map(r => {
      const id = `nr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      return `('${id}', '${notificationId}', '${r.userId}', '${r.userName || ''}', '${r.userRole || ''}', 'pending', NOW())`
    }).join(',')

    await this.pool.query(`
      INSERT INTO notification_recipients (id, "notificationId", "userId", "userName", "userRole", status, "createdAt")
      VALUES ${values}
    `)
  }

  // ============================================
  // DELIVERY QUEUE MANAGEMENT
  // ============================================

  private async queueDelivery(
    notificationId: string, 
    channels: NotificationChannel[], 
    recipients: ResolvedRecipient[],
    priority: NotificationPriority | string
  ): Promise<void> {
    const priorityScore = this.getPriorityScore(priority)
    
    for (const channel of channels) {
      const id = `nq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      await this.pool.query(`
        INSERT INTO notification_queue (
          id, "notificationId", status, priority, channel, 
          attempts, "maxAttempts", "createdAt", "updatedAt"
        ) VALUES ($1, $2, 'queued', $3, $4, 0, 3, NOW(), NOW())
      `, [id, notificationId, priorityScore, channel])
    }

    // Update notification status
    await this.pool.query(`
      UPDATE notifications SET status = 'sent', "sentAt" = NOW() WHERE id = $1
    `, [notificationId])
  }

  // ============================================
  // CONTENT BUILDING
  // ============================================

  private async buildNotificationContent(trigger: NotificationTrigger): Promise<{
    title: string
    message: string
    category: NotificationCategory
  }> {
    const { event, data, actor, patient } = trigger

    // Get template if exists
    const template = await this.getTemplate(event)
    
    if (template) {
      const variables = {
        patientName: patient?.name || data.patientName || 'Patient',
        actorName: actor?.name || 'System',
        ...data
      }

      let title = template.titleTemplate
      let message = template.messageTemplate

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g')
        title = title.replace(regex, String(value))
        message = message.replace(regex, String(value))
      })

      return {
        title,
        message,
        category: template.category as NotificationCategory
      }
    }

    // Fallback to default content generation
    return this.generateDefaultContent(trigger)
  }

  private async getTemplate(event: string): Promise<{
    titleTemplate: string
    messageTemplate: string
    category: string
  } | null> {
    try {
      const result = await this.pool.query(
        `SELECT "titleTemplate", "messageTemplate", category FROM notification_templates WHERE type = $1 AND "isActive" = true`,
        [event]
      )
      return result.rows[0] || null
    } catch {
      return null
    }
  }

  private generateDefaultContent(trigger: NotificationTrigger): {
    title: string
    message: string
    category: NotificationCategory
  } {
    const { event, data, actor, patient } = trigger
    const patientName = patient?.name || data.patientName || 'a patient'
    const actorName = actor?.name || 'System'

    const contentMap: Record<string, { title: string; message: string; category: NotificationCategory }> = {
      patient_registered: {
        title: 'New Patient Registered',
        message: `${patientName} has been registered in the system.`,
        category: 'patient'
      },
      patient_admitted: {
        title: 'Patient Admitted',
        message: `${patientName} has been admitted to ${data.unit || 'the ward'}.`,
        category: 'patient'
      },
      patient_discharged: {
        title: 'Patient Discharged',
        message: `${patientName} has been discharged.`,
        category: 'patient'
      },
      appointment_created: {
        title: 'New Appointment',
        message: `Appointment scheduled for ${patientName} on ${data.date || 'TBD'}.`,
        category: 'patient'
      },
      appointment_reminder: {
        title: 'Appointment Reminder',
        message: `Reminder: Your appointment is scheduled for ${data.date || 'today'}.`,
        category: 'patient'
      },
      consultation_routed: {
        title: 'New Consultation Routed',
        message: `A consultation for ${patientName} has been routed to you.`,
        category: 'staff'
      },
      lab_request_created: {
        title: 'New Lab Request',
        message: `Lab tests requested for ${patientName}.`,
        category: 'lab'
      },
      lab_result_ready: {
        title: 'Lab Results Ready',
        message: `Lab results are ready for ${patientName}.`,
        category: 'lab'
      },
      prescription_created: {
        title: 'New Prescription',
        message: `Prescription created for ${patientName}.`,
        category: 'pharmacy'
      },
      prescription_ready: {
        title: 'Prescription Ready',
        message: `Your prescription is ready for pickup.`,
        category: 'pharmacy'
      },
      bill_generated: {
        title: 'New Bill Generated',
        message: `A bill of ${data.amount || 'N/A'} has been generated.`,
        category: 'billing'
      },
      payment_received: {
        title: 'Payment Received',
        message: `Payment of ${data.amount || 'N/A'} has been received.`,
        category: 'billing'
      },
      queue_called: {
        title: 'Your Turn!',
        message: `Please proceed to ${data.department || 'the counter'}.`,
        category: 'patient'
      },
      staff_account_created: {
        title: 'New Staff Account',
        message: `${data.userName || 'A new staff member'} has registered and is pending approval.`,
        category: 'staff'
      },
      staff_account_approved: {
        title: 'Account Approved',
        message: `Your account has been approved. You can now log in.`,
        category: 'staff'
      },
      emergency_admission: {
        title: '🚨 EMERGENCY ADMISSION',
        message: `Emergency patient arriving. Immediate attention required!`,
        category: 'emergency'
      },
      critical_vitals: {
        title: '⚠️ Critical Vitals Alert',
        message: `Abnormal vitals detected for ${patientName}. Immediate attention required.`,
        category: 'emergency'
      },
      code_blue: {
        title: '🚨 CODE BLUE',
        message: `Code Blue activated for ${patientName}. Location: ${data.location || 'Unknown'}`,
        category: 'emergency'
      }
    }

    return contentMap[event] || {
      title: 'New Notification',
      message: `Event: ${event}`,
      category: 'system'
    }
  }

  // ============================================
  // ACTION URL BUILDER
  // ============================================

  private buildActionUrl(trigger: NotificationTrigger): string {
    const { event, data } = trigger

    const urlMap: Record<string, string> = {
      patient_registered: `/hms?tab=patients&patientId=${data.patientId}`,
      patient_admitted: `/hms?tab=admissions&patientId=${data.patientId}`,
      appointment_created: `/hms?tab=appointments&appointmentId=${data.appointmentId}`,
      consultation_routed: `/hms?tab=consultations&consultationId=${data.consultationId}`,
      lab_request_created: `/hms?tab=lab&requestId=${data.requestId}`,
      lab_result_ready: `/hms?tab=lab&resultId=${data.resultId}`,
      prescription_created: `/hms?tab=pharmacy&prescriptionId=${data.prescriptionId}`,
      staff_account_created: `/hms?tab=staff-management`,
      emergency_admission: `/hms?tab=emergency`,
      critical_vitals: `/hms?tab=patients&patientId=${data.patientId}`
    }

    return urlMap[event] || '/hms'
  }

  // ============================================
  // STATUS UPDATE METHODS
  // ============================================

  async markAsDelivered(
    notificationId: string, 
    userId: string, 
    deviceInfo?: { deviceId?: string; deviceType?: string }
  ): Promise<boolean> {
    try {
      // Update recipient status
      await this.pool.query(`
        UPDATE notification_recipients 
        SET status = 'delivered', "deliveredAt" = NOW(), "deliveredToDevice" = $3
        WHERE "notificationId" = $1 AND "userId" = $2
      `, [notificationId, userId, deviceInfo?.deviceId || null])

      // Update main notification if all recipients delivered
      await this.updateMainNotificationStatus(notificationId, 'delivered')

      await this.logNotificationAction(notificationId, 'delivered', 'success', 'in-app', deviceInfo)

      return true
    } catch (error: any) {
      logger.error('Failed to mark notification as delivered', { error: error.message })
      return false
    }
  }

  async markAsRead(
    notificationId: string, 
    userId: string,
    deviceInfo?: { deviceId?: string; deviceType?: string }
  ): Promise<boolean> {
    try {
      // Update recipient status
      await this.pool.query(`
        UPDATE notification_recipients 
        SET status = 'read', "readAt" = NOW(), "readOnDevice" = $3
        WHERE "notificationId" = $1 AND "userId" = $2
      `, [notificationId, userId, deviceInfo?.deviceId || null])

      // Update main notification
      await this.pool.query(`
        UPDATE notifications 
        SET status = 'read', "readAt" = NOW(), "inAppDelivered" = true
        WHERE id = $1
      `, [notificationId])

      await this.logNotificationAction(notificationId, 'read', 'success', 'in-app', deviceInfo)

      return true
    } catch (error: any) {
      logger.error('Failed to mark notification as read', { error: error.message })
      return false
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.pool.query(`
        UPDATE notification_recipients 
        SET status = 'read', "readAt" = NOW()
        WHERE "userId" = $1 AND status != 'read'
      `, [userId])

      // Also update main notifications
      await this.pool.query(`
        UPDATE notifications 
        SET status = 'read', "readAt" = NOW()
        WHERE "userId" = $1 AND status != 'read'
      `, [userId])

      return result.rowCount || 0
    } catch (error: any) {
      logger.error('Failed to mark all notifications as read', { error: error.message })
      return 0
    }
  }

  private async updateMainNotificationStatus(notificationId: string, status: NotificationStatus): Promise<void> {
    const deliveredAt = status === 'delivered' ? 'NOW()' : null

    await this.pool.query(`
      UPDATE notifications 
      SET status = $2, ${status === 'delivered' ? '"deliveredAt" = NOW()' : '"readAt" = NOW()'}, "inAppDelivered" = true
      WHERE id = $1
    `, [notificationId, status])
  }

  // ============================================
  // FETCHING METHODS
  // ============================================

  async getNotificationsForUser(
    userId: string,
    options: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
      types?: string[]
    } = {}
  ): Promise<{ notifications: any[]; unreadCount: number; totalCount: number }> {
    const { unreadOnly = false, limit = 50, offset = 0, types } = options

    try {
      // Get user's role for role-based notifications
      const userResult = await this.pool.query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      )
      const userRole = userResult.rows[0]?.role

      // Build conditions
      const conditions = [`nr."userId" = $1`]
      const params: any[] = [userId]
      let paramIndex = 2

      if (userRole) {
        conditions.push(`n."targetRoles"::text LIKE $${paramIndex}`)
        params.push(`%${userRole}%`)
        paramIndex++
      }

      if (unreadOnly) {
        conditions.push(`nr.status != 'read'`)
      }

      if (types && types.length > 0) {
        conditions.push(`n.type = ANY($${paramIndex})`)
        params.push(types)
        paramIndex++
      }

      const whereClause = `(${conditions.join(' OR ')})`

      // Fetch notifications
      const query = `
        SELECT DISTINCT n.*, nr.status as "recipientStatus", nr."readAt" as "recipientReadAt"
        FROM notifications n
        LEFT JOIN notification_recipients nr ON n.id = nr."notificationId"
        WHERE ${whereClause}
        ORDER BY 
          CASE n.priority 
            WHEN 'critical' THEN 0 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            ELSE 3 
          END,
          n."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      params.push(limit, offset)

      const result = await this.pool.query(query, params)
      const notifications = result.rows

      // Get counts
      const countQuery = `
        SELECT 
          COUNT(DISTINCT n.id) as "totalCount",
          COUNT(DISTINCT CASE WHEN nr.status != 'read' THEN n.id END) as "unreadCount"
        FROM notifications n
        LEFT JOIN notification_recipients nr ON n.id = nr."notificationId"
        WHERE ${whereClause.replace(`LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, '')}
      `
      const countParams = params.slice(0, paramIndex - 1)
      const countResult = await this.pool.query(countQuery, countParams)

      return {
        notifications,
        unreadCount: parseInt(countResult.rows[0]?.unreadCount || '0'),
        totalCount: parseInt(countResult.rows[0]?.totalCount || '0')
      }

    } catch (error: any) {
      logger.error('Failed to fetch notifications', { error: error.message })
      return { notifications: [], unreadCount: 0, totalCount: 0 }
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const userResult = await this.pool.query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      )
      const userRole = userResult.rows[0]?.role

      const result = await this.pool.query(`
        SELECT COUNT(DISTINCT n.id) as count
        FROM notifications n
        LEFT JOIN notification_recipients nr ON n.id = nr."notificationId"
        WHERE (nr."userId" = $1 OR n."targetRoles"::text LIKE $2)
        AND nr.status != 'read'
      `, [userId, `%${userRole}%`])

      return parseInt(result.rows[0]?.count || '0')
    } catch {
      return 0
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getPriorityScore(priority: string): number {
    const scores: Record<string, number> = {
      critical: 100,
      high: 75,
      normal: 50,
      low: 25
    }
    return scores[priority] || 50
  }

  private async logNotificationAction(
    notificationId: string,
    action: string,
    status: string,
    channel?: string,
    deviceInfo?: { deviceId?: string; deviceType?: string }
  ): Promise<void> {
    try {
      const id = `nl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      await this.pool.query(`
        INSERT INTO notification_logs (id, "notificationId", action, channel, status, "deviceId", "deviceType", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [id, notificationId, action, channel || null, status, deviceInfo?.deviceId || null, deviceInfo?.deviceType || null])
    } catch (error: any) {
      logger.error('Failed to log notification action', { error: error.message })
    }
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const notificationEngine = NotificationEngine.getInstance()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function notify(trigger: NotificationTrigger): Promise<{
  success: boolean
  notificationId?: string
  recipients?: number
  error?: string
}> {
  return notificationEngine.createFromTrigger(trigger)
}

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  options: Partial<CreateNotificationRequest> = {}
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return notificationEngine.createDirect({
    userId,
    title,
    message,
    type: options.type || 'system_alert',
    ...options
  })
}

export async function notifyRole(
  role: string,
  title: string,
  message: string,
  options: Partial<CreateNotificationRequest> = {}
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return notificationEngine.createDirect({
    targetRoles: [role],
    title,
    message,
    type: options.type || 'system_alert',
    isBroadcast: true,
    ...options
  })
}

export async function broadcastNotification(
  title: string,
  message: string,
  options: Partial<CreateNotificationRequest> = {}
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return notificationEngine.createDirect({
    targetRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER'],
    title,
    message,
    type: options.type || 'system_alert',
    isBroadcast: true,
    ...options
  })
}
