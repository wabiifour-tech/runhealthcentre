// ============================================
// NOTIFICATION WORKER - Queue Processing & Delivery
// Handles async notification delivery with retry logic
// ============================================

import { getPool } from './db'
import { 
  NotificationChannel,
  NotificationPriority,
  NotificationStatus
} from './notification-types'
import { createLogger } from './logger'

const logger = createLogger('NotificationWorker')

// ============================================
// WORKER CONFIGURATION
// ============================================

interface WorkerConfig {
  maxRetries: number
  retryDelays: number[] // milliseconds
  batchSize: number
  pollingInterval: number // milliseconds
}

const DEFAULT_CONFIG: WorkerConfig = {
  maxRetries: 3,
  retryDelays: [5000, 15000, 60000, 300000], // 5s, 15s, 1min, 5min
  batchSize: 50,
  pollingInterval: 5000
}

// ============================================
// NOTIFICATION WORKER CLASS
// ============================================

export class NotificationWorker {
  private pool: any
  private config: WorkerConfig
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private static instance: NotificationWorker

  private constructor(config: Partial<WorkerConfig> = {}) {
    this.pool = getPool()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  static getInstance(config?: Partial<WorkerConfig>): NotificationWorker {
    if (!NotificationWorker.instance) {
      NotificationWorker.instance = new NotificationWorker(config)
    }
    return NotificationWorker.instance
  }

  // ============================================
  // WORKER CONTROL
  // ============================================

  start(): void {
    if (this.isRunning) {
      logger.warn('Notification worker is already running')
      return
    }

    this.isRunning = true
    logger.info('Starting notification worker...')

    // Process immediately on start
    this.processQueue()

    // Then poll at intervals
    this.intervalId = setInterval(() => {
      this.processQueue()
    }, this.config.pollingInterval)
  }

  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    logger.info('Notification worker stopped')
  }

  // ============================================
  // QUEUE PROCESSING
  // ============================================

  async processQueue(): Promise<{
    processed: number
    succeeded: number
    failed: number
  }> {
    const stats = { processed: 0, succeeded: 0, failed: 0 }

    try {
      // Get pending queue items
      const queueItems = await this.getPendingQueueItems()

      if (queueItems.length === 0) {
        return stats
      }

      logger.info(`Processing ${queueItems.length} notification queue items`)

      // Process each item
      for (const item of queueItems) {
        stats.processed++
        
        const result = await this.processQueueItem(item)
        
        if (result.success) {
          stats.succeeded++
        } else {
          stats.failed++
        }
      }

      // Clean up old completed items
      await this.cleanupOldItems()

      return stats

    } catch (error: any) {
      logger.error('Error processing notification queue', { error: error.message })
      return stats
    }
  }

  private async getPendingQueueItems(): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT 
          nq.*,
          n.id as "notificationId",
          n.title,
          n.message,
          n.type,
          n.priority,
          n.data,
          n."userId",
          n."targetRoles",
          n.sendername,
          n.senderrole
        FROM notification_queue nq
        JOIN notifications n ON nq."notificationId" = n.id
        WHERE nq.status IN ('queued', 'processing')
        AND nq.attempts < nq."maxAttempts"
        AND (nq."nextAttemptAt" IS NULL OR nq."nextAttemptAt" <= NOW())
        ORDER BY nq.priority DESC, nq."createdAt" ASC
        LIMIT $1
      `, [this.config.batchSize])

      return result.rows

    } catch (error: any) {
      logger.error('Error fetching pending queue items', { error: error.message })
      return []
    }
  }

  private async processQueueItem(item: any): Promise<{ success: boolean; error?: string }> {
    const { id, notificationId, channel, title, message, data, userId, targetRoles } = item

    try {
      // Mark as processing
      await this.pool.query(`
        UPDATE notification_queue 
        SET status = 'processing', "processingBy" = $2, "lastAttemptAt" = NOW()
        WHERE id = $1
      `, [id, `worker-${process.pid}-${Date.now()}`])

      let result = { success: false, error: 'Unknown channel' }

      // Process based on channel
      switch (channel) {
        case 'in-app':
          result = await this.deliverInApp(notificationId, userId, targetRoles)
          break
        case 'push':
          result = await this.deliverPush(notificationId, userId, title, message, data, targetRoles)
          break
        case 'sms':
          result = await this.deliverSms(notificationId, userId, title, message, targetRoles)
          break
        case 'email':
          result = await this.deliverEmail(notificationId, userId, title, message, data, targetRoles)
          break
      }

      if (result.success) {
        // Mark as completed
        await this.pool.query(`
          UPDATE notification_queue 
          SET status = 'completed', "completedAt" = NOW()
          WHERE id = $1
        `, [id])

        // Update notification channel status
        await this.updateChannelStatus(notificationId, channel, true)

        logger.info(`Notification ${notificationId} delivered via ${channel}`)
      } else {
        // Handle failure
        await this.handleFailedDelivery(id, notificationId, channel, result.error || 'Unknown error')
      }

      return result

    } catch (error: any) {
      await this.handleFailedDelivery(id, notificationId, channel, error.message)
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // DELIVERY METHODS
  // ============================================

  private async deliverInApp(
    notificationId: string,
    userId: string | null,
    targetRoles: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For in-app, just update the status - it will be picked up by real-time subscription
      await this.pool.query(`
        UPDATE notifications 
        SET "inAppDelivered" = true, status = 'delivered', "deliveredAt" = NOW()
        WHERE id = $1
      `, [notificationId])

      // Update recipient statuses
      if (userId) {
        await this.pool.query(`
          UPDATE notification_recipients 
          SET status = 'delivered', "deliveredAt" = NOW()
          WHERE "notificationId" = $1 AND "userId" = $2
        `, [notificationId, userId])
      } else if (targetRoles) {
        // For role-based, update all matching recipients
        const roles = JSON.parse(targetRoles)
        for (const role of roles) {
          await this.pool.query(`
            UPDATE notification_recipients nr
            SET status = 'delivered', "deliveredAt" = NOW()
            FROM users u
            WHERE nr."notificationId" = $1 
            AND nr."userId" = u.id 
            AND u.role = $2
          `, [notificationId, role])
        }
      }

      return { success: true }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private async deliverPush(
    notificationId: string,
    userId: string | null,
    title: string,
    message: string,
    data: any,
    targetRoles: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get device tokens for push
      let deviceTokens: string[] = []

      if (userId) {
        const result = await this.pool.query(`
          SELECT "deviceToken" FROM user_devices 
          WHERE "userId" = $1 AND "isActive" = true AND "pushEnabled" = true
        `, [userId])
        deviceTokens = result.rows.map(r => r.deviceToken).filter(Boolean)
      } else if (targetRoles) {
        const roles = JSON.parse(targetRoles)
        const result = await this.pool.query(`
          SELECT ud."deviceToken" 
          FROM user_devices ud
          JOIN users u ON ud."userId" = u.id
          WHERE u.role = ANY($1) AND ud."isActive" = true AND ud."pushEnabled" = true
        `, [roles])
        deviceTokens = result.rows.map(r => r.deviceToken).filter(Boolean)
      }

      if (deviceTokens.length === 0) {
        return { success: true } // No devices, but not an error
      }

      // Send push notifications via FCM
      const pushResults = await this.sendPushNotifications(deviceTokens, {
        title,
        body: message,
        data: {
          notificationId,
          type: data?.type || 'general',
          actionUrl: data?.actionUrl || '/hms'
        }
      })

      // Update notification push status
      await this.pool.query(`
        UPDATE notifications SET "pushDelivered" = $2 WHERE id = $1
      `, [notificationId, pushResults.success])

      return { success: pushResults.success, error: pushResults.error }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private async deliverSms(
    notificationId: string,
    userId: string | null,
    title: string,
    message: string,
    targetRoles: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get phone numbers for SMS
      let phones: string[] = []

      if (userId) {
        // Get from user or patient
        const userResult = await this.pool.query(
          `SELECT phone FROM users WHERE id = $1`,
          [userId]
        )
        if (userResult.rows[0]?.phone) {
          phones.push(userResult.rows[0].phone)
        }
      } else if (targetRoles) {
        const roles = JSON.parse(targetRoles)
        const result = await this.pool.query(`
          SELECT phone FROM users 
          WHERE role = ANY($1) AND phone IS NOT NULL AND "isActive" = true
        `, [roles])
        phones = result.rows.map(r => r.phone).filter(Boolean)
      }

      if (phones.length === 0) {
        return { success: true } // No phones, but not an error
      }

      // Send SMS
      const smsResults = await this.sendSmsMessages(phones, `${title}\n\n${message}`)

      await this.pool.query(`
        UPDATE notifications SET "smsDelivered" = $2 WHERE id = $1
      `, [notificationId, smsResults.success])

      return { success: smsResults.success, error: smsResults.error }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private async deliverEmail(
    notificationId: string,
    userId: string | null,
    title: string,
    message: string,
    data: any,
    targetRoles: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get email addresses
      let emails: string[] = []

      if (userId) {
        const userResult = await this.pool.query(
          `SELECT email FROM users WHERE id = $1`,
          [userId]
        )
        if (userResult.rows[0]?.email) {
          emails.push(userResult.rows[0].email)
        }
      } else if (targetRoles) {
        const roles = JSON.parse(targetRoles)
        const result = await this.pool.query(`
          SELECT email FROM users 
          WHERE role = ANY($1) AND email IS NOT NULL AND "isActive" = true
        `, [roles])
        emails = result.rows.map(r => r.email).filter(Boolean)
      }

      if (emails.length === 0) {
        return { success: true } // No emails, but not an error
      }

      // Send emails
      const emailResults = await this.sendEmails(emails, title, message, data)

      await this.pool.query(`
        UPDATE notifications SET "emailDelivered" = $2 WHERE id = $1
      `, [notificationId, emailResults.success])

      return { success: emailResults.success, error: emailResults.error }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // EXTERNAL SERVICE INTEGRATIONS
  // ============================================

  private async sendPushNotifications(
    tokens: string[],
    payload: { title: string; body: string; data?: any }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call FCM API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, payload })
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }

      return { success: true }
    } catch (error: any) {
      // If push service not configured, silently succeed
      console.log('Push notification service not available:', error.message)
      return { success: true }
    }
  }

  private async sendSmsMessages(
    phones: string[],
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call SMS API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: phones[0], // Send one at a time for now
          message 
        })
      })

      if (!response.ok) {
        const result = await response.json()
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error: any) {
      // If SMS service not configured, silently succeed
      console.log('SMS service not available:', error.message)
      return { success: true }
    }
  }

  private async sendEmails(
    emails: string[],
    subject: string,
    body: string,
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call email API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: emails, 
          subject, 
          body,
          type: data?.type || 'notification'
        })
      })

      if (!response.ok) {
        const result = await response.json()
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error: any) {
      // If email service not configured, silently succeed
      console.log('Email service not available:', error.message)
      return { success: true }
    }
  }

  // ============================================
  // FAILURE HANDLING
  // ============================================

  private async handleFailedDelivery(
    queueId: string,
    notificationId: string,
    channel: string,
    error: string
  ): Promise<void> {
    const { attempts } = await this.pool.query(
      `SELECT attempts FROM notification_queue WHERE id = $1`,
      [queueId]
    ).then(r => r.rows[0] || { attempts: 0 })

    const newAttempts = attempts + 1
    const isLastAttempt = newAttempts >= this.config.maxRetries

    if (isLastAttempt) {
      // Mark as failed permanently
      await this.pool.query(`
        UPDATE notification_queue 
        SET status = 'failed', "failedAt" = NOW(), "errorMessage" = $3, attempts = $4
        WHERE id = $1
      `, [queueId, notificationId, error, newAttempts])

      // Update notification status
      await this.pool.query(`
        UPDATE notifications 
        SET status = 'failed', "failedAt" = NOW(), "failureReason" = $2
        WHERE id = $1
      `, [notificationId, `Failed to deliver via ${channel}: ${error}`])

      // Log failure
      await this.logFailure(notificationId, channel, error)

    } else {
      // Schedule retry
      const nextDelay = this.config.retryDelays[newAttempts] || this.config.retryDelays[this.config.retryDelays.length - 1]
      const nextAttemptAt = new Date(Date.now() + nextDelay)

      await this.pool.query(`
        UPDATE notification_queue 
        SET attempts = $2, "nextAttemptAt" = $3, "errorMessage" = $4
        WHERE id = $1
      `, [queueId, newAttempts, nextAttemptAt, error])
    }
  }

  private async updateChannelStatus(
    notificationId: string,
    channel: string,
    success: boolean
  ): Promise<void> {
    const fieldMap: Record<string, string> = {
      'in-app': 'inAppDelivered',
      'push': 'pushDelivered',
      'sms': 'smsDelivered',
      'email': 'emailDelivered'
    }

    const field = fieldMap[channel]
    if (field) {
      await this.pool.query(`
        UPDATE notifications SET "${field}" = $2 WHERE id = $1
      `, [notificationId, success])
    }
  }

  private async logFailure(
    notificationId: string,
    channel: string,
    error: string
  ): Promise<void> {
    try {
      const id = `nl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      await this.pool.query(`
        INSERT INTO notification_logs (id, "notificationId", action, channel, status, "errorMessage", "createdAt")
        VALUES ($1, $2, 'delivery_failed', $3, 'failed', $4, NOW())
      `, [id, notificationId, channel, error])
    } catch (e) {
      // Ignore logging errors
    }
  }

  private async cleanupOldItems(): Promise<void> {
    try {
      // Delete completed items older than 7 days
      await this.pool.query(`
        DELETE FROM notification_queue 
        WHERE status = 'completed' 
        AND "completedAt" < NOW() - INTERVAL '7 days'
      `)

      // Delete failed items older than 30 days
      await this.pool.query(`
        DELETE FROM notification_queue 
        WHERE status = 'failed' 
        AND "failedAt" < NOW() - INTERVAL '30 days'
      `)
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getQueueStats(): Promise<{
    queued: number
    processing: number
    completed: number
    failed: number
  }> {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'queued') as queued,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM notification_queue
      `)

      return result.rows[0]
    } catch {
      return { queued: 0, processing: 0, completed: 0, failed: 0 }
    }
  }

  async retryFailed(notificationId?: string): Promise<number> {
    try {
      let query = `UPDATE notification_queue SET status = 'queued', attempts = 0, "nextAttemptAt" = NULL WHERE status = 'failed'`
      const params: any[] = []

      if (notificationId) {
        query += ` AND "notificationId" = $1`
        params.push(notificationId)
      }

      const result = await this.pool.query(query, params)
      return result.rowCount || 0
    } catch {
      return 0
    }
  }
}

// ============================================
// EXPORT SINGLETON AND CONVENIENCE FUNCTIONS
// ============================================

export const notificationWorker = NotificationWorker.getInstance()

// Auto-start worker in production
if (process.env.NODE_ENV === 'production') {
  // Note: In serverless environments, we process on-demand instead
  // notificationWorker.start()
}

// Process queue on demand (for serverless)
export async function processNotificationQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  return notificationWorker.processQueue()
}
