// ============================================
// NOTIFICATION DELIVERY API - Mark Notifications as Delivered
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('NotificationDelivery')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationIds, deviceId, deviceType } = body

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId required' 
      }, { status: 400 })
    }

    const pool = getPool()

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as delivered
      for (const notificationId of notificationIds) {
        // Update recipient record
        await pool.query(`
          UPDATE notification_recipients 
          SET status = 'delivered', "deliveredAt" = NOW(), "deliveredToDevice" = $3
          WHERE "notificationId" = $1 AND "userId" = $2 AND status = 'pending'
        `, [notificationId, userId, deviceId || null])

        // Update main notification
        await pool.query(`
          UPDATE notifications 
          SET "inAppDelivered" = true
          WHERE id = $1 AND "inAppDelivered" = false
        `, [notificationId])
      }

      return NextResponse.json({ 
        success: true, 
        delivered: notificationIds.length 
      })
    }

    // Mark all pending notifications as delivered for user
    const result = await pool.query(`
      UPDATE notification_recipients 
      SET status = 'delivered', "deliveredAt" = NOW(), "deliveredToDevice" = $2
      WHERE "userId" = $1 AND status = 'pending'
    `, [userId, deviceId || null])

    await pool.query(`
      UPDATE notifications n
      SET "inAppDelivered" = true
      FROM notification_recipients nr
      WHERE nr."notificationId" = n.id
      AND nr."userId" = $1
      AND n."inAppDelivered" = false
    `, [userId])

    logger.info(`Marked ${result.rowCount || 0} notifications as delivered for user ${userId}`)

    return NextResponse.json({ 
      success: true, 
      delivered: result.rowCount || 0 
    })

  } catch (error: any) {
    logger.error('Error marking notifications as delivered', { error: error.message })
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
