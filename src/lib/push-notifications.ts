// ============================================
// PUSH NOTIFICATION SERVICE - Firebase Cloud Messaging Integration
// ============================================

import { getPool } from './db'
import { createLogger } from './logger'

const logger = createLogger('PushNotifications')

// ============================================
// TYPES
// ============================================

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  click_action?: string
  data?: Record<string, string>
}

interface PushResult {
  success: boolean
  messageId?: string
  error?: string
}

interface DeviceToken {
  userId: string
  deviceToken: string
  deviceType: string
  deviceName?: string
}

// ============================================
// PUSH NOTIFICATION SERVICE CLASS
// ============================================

export class PushNotificationService {
  private pool: any
  private fcmServerKey: string | null
  private static instance: PushNotificationService

  private constructor() {
    this.pool = getPool()
    this.fcmServerKey = process.env.FCM_SERVER_KEY || null
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  // ============================================
  // DEVICE REGISTRATION
  // ============================================

  /**
   * Register a device token for push notifications
   */
  async registerDevice(params: {
    userId: string
    deviceToken: string
    deviceType: 'desktop' | 'mobile' | 'tablet'
    deviceName?: string
    deviceId?: string
    platform?: 'web' | 'android' | 'ios'
    osVersion?: string
    appVersion?: string
  }): Promise<{ success: boolean; deviceId?: string; error?: string }> {
    try {
      const id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Check if device token already exists
      const existingResult = await this.pool.query(
        `SELECT id FROM user_devices WHERE "deviceToken" = $1`,
        [params.deviceToken]
      )

      if (existingResult.rows.length > 0) {
        // Update existing device
        await this.pool.query(`
          UPDATE user_devices 
          SET "userId" = $1, "deviceType" = $2, "deviceName" = $3, 
              "deviceId" = $4, platform = $5, "osVersion" = $6, 
              "appVersion" = $7, "isActive" = true, "lastActiveAt" = NOW()
          WHERE "deviceToken" = $8
        `, [
          params.userId,
          params.deviceType,
          params.deviceName || null,
          params.deviceId || null,
          params.platform || 'web',
          params.osVersion || null,
          params.appVersion || null,
          params.deviceToken
        ])

        return { success: true, deviceId: existingResult.rows[0].id }
      }

      // Insert new device
      await this.pool.query(`
        INSERT INTO user_devices (
          id, "userId", "deviceToken", "deviceType", "deviceName",
          "deviceId", platform, "osVersion", "appVersion", 
          "isActive", "pushEnabled", "lastActiveAt", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true, NOW(), NOW())
      `, [
        id,
        params.userId,
        params.deviceToken,
        params.deviceType,
        params.deviceName || null,
        params.deviceId || null,
        params.platform || 'web',
        params.osVersion || null,
        params.appVersion || null
      ])

      logger.info(`Device registered for user ${params.userId}`)

      return { success: true, deviceId: id }

    } catch (error: any) {
      logger.error('Failed to register device', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(deviceToken: string): Promise<{ success: boolean }> {
    try {
      await this.pool.query(
        `UPDATE user_devices SET "isActive" = false WHERE "deviceToken" = $1`,
        [deviceToken]
      )
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string): Promise<DeviceToken[]> {
    try {
      const result = await this.pool.query(`
        SELECT "userId", "deviceToken", "deviceType", "deviceName"
        FROM user_devices
        WHERE "userId" = $1 AND "isActive" = true AND "pushEnabled" = true
      `, [userId])
      return result.rows
    } catch {
      return []
    }
  }

  // ============================================
  // SEND PUSH NOTIFICATION
  // ============================================

  /**
   * Send push notification to specific devices
   */
  async sendToDevices(deviceTokens: string[], payload: PushPayload): Promise<PushResult> {
    if (!this.fcmServerKey) {
      logger.warn('FCM_SERVER_KEY not configured, push notifications disabled')
      return { success: true } // Silent success when not configured
    }

    if (deviceTokens.length === 0) {
      return { success: true }
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registration_ids: deviceTokens,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192x192.png',
            badge: payload.badge || '/badge-72x72.png',
            image: payload.image,
            click_action: payload.click_action
          },
          data: payload.data || {},
          android: {
            priority: 'high',
            notification: {
              channel_id: 'hms-notifications',
              priority: 'high',
              default_sound: true,
              default_vibrate_timings: true
            }
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body
                },
                badge: 1,
                sound: 'default'
              }
            }
          }
        })
      })

      const result = await response.json()

      if (response.ok) {
        logger.info(`Push notification sent to ${deviceTokens.length} devices`)
        return { success: true, messageId: result.message_id }
      } else {
        logger.error('Push notification failed', { error: result })
        return { success: false, error: JSON.stringify(result) }
      }

    } catch (error: any) {
      logger.error('Failed to send push notification', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<PushResult> {
    const devices = await this.getUserDevices(userId)
    const tokens = devices.map(d => d.deviceToken).filter(Boolean)
    return this.sendToDevices(tokens, payload)
  }

  /**
   * Send push notification to users by role
   */
  async sendToRole(role: string, payload: PushPayload): Promise<PushResult> {
    try {
      const result = await this.pool.query(`
        SELECT ud."deviceToken"
        FROM user_devices ud
        JOIN users u ON ud."userId" = u.id
        WHERE u.role = $1 AND ud."isActive" = true AND ud."pushEnabled" = true
      `, [role])

      const tokens = result.rows.map(r => r.deviceToken).filter(Boolean)
      return this.sendToDevices(tokens, payload)

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Send broadcast push notification to all active devices
   */
  async broadcast(payload: PushPayload): Promise<PushResult> {
    try {
      const result = await this.pool.query(`
        SELECT "deviceToken" FROM user_devices
        WHERE "isActive" = true AND "pushEnabled" = true
        LIMIT 1000
      `)

      const tokens = result.rows.map(r => r.deviceToken).filter(Boolean)
      return this.sendToDevices(tokens, payload)

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // BADGE MANAGEMENT
  // ============================================

  /**
   * Update badge count for a user's devices
   */
  async updateBadgeCount(userId: string, count: number): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE user_devices SET "badgeCount" = $1 WHERE "userId" = $2
      `, [count, userId])
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Clear badge for all user devices
   */
  async clearBadge(userId: string): Promise<void> {
    await this.updateBadgeCount(userId, 0)
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const pushNotificationService = PushNotificationService.getInstance()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  return pushNotificationService.sendToUser(userId, {
    title,
    body,
    data,
    click_action: data?.actionUrl
  })
}

export async function registerDeviceToken(params: {
  userId: string
  deviceToken: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  deviceName?: string
}): Promise<{ success: boolean; error?: string }> {
  return pushNotificationService.registerDevice(params)
}
