// ============================================
// NOTIFICATION PREFERENCES API - User Settings Management
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('NotificationPreferences')

// GET - Fetch user notification preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId required' 
      }, { status: 400 })
    }

    const pool = getPool()

    const result = await pool.query(
      `SELECT * FROM user_notification_preferences WHERE "userId" = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default preferences
      return NextResponse.json({
        success: true,
        preferences: {
          inAppEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          emailEnabled: false,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          quietHoursTimezone: 'Africa/Lagos',
          allowCriticalOverride: true,
          digestEnabled: false,
          digestFrequency: 'daily',
          digestTime: '09:00'
        }
      })
    }

    const row = result.rows[0]
    
    return NextResponse.json({
      success: true,
      preferences: {
        inAppEnabled: row.inAppEnabled,
        pushEnabled: row.pushEnabled,
        smsEnabled: row.smsEnabled,
        emailEnabled: row.emailEnabled,
        quietHoursEnabled: row.quietHoursEnabled,
        quietHoursStart: row.quietHoursStart,
        quietHoursEnd: row.quietHoursEnd,
        quietHoursTimezone: row.quietHoursTimezone,
        allowCriticalOverride: row.allowCriticalOverride,
        digestEnabled: row.digestEnabled,
        digestFrequency: row.digestFrequency,
        digestTime: row.digestTime,
        typePreferences: row.typePreferences ? 
          (typeof row.typePreferences === 'string' ? JSON.parse(row.typePreferences) : row.typePreferences) : 
          null
      }
    })

  } catch (error: any) {
    logger.error('Failed to fetch preferences', { error: error.message })
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// POST - Save user notification preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      inAppEnabled,
      pushEnabled,
      smsEnabled,
      emailEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      quietHoursTimezone,
      allowCriticalOverride,
      digestEnabled,
      digestFrequency,
      digestTime,
      typePreferences
    } = body

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId required' 
      }, { status: 400 })
    }

    const pool = getPool()

    // Check if preferences exist
    const existingResult = await pool.query(
      `SELECT id FROM user_notification_preferences WHERE "userId" = $1`,
      [userId]
    )

    if (existingResult.rows.length > 0) {
      // Update existing
      await pool.query(`
        UPDATE user_notification_preferences SET
          "inAppEnabled" = $2,
          "pushEnabled" = $3,
          "smsEnabled" = $4,
          "emailEnabled" = $5,
          "quietHoursEnabled" = $6,
          "quietHoursStart" = $7,
          "quietHoursEnd" = $8,
          "quietHoursTimezone" = $9,
          "allowCriticalOverride" = $10,
          "digestEnabled" = $11,
          "digestFrequency" = $12,
          "digestTime" = $13,
          "typePreferences" = $14,
          "updatedAt" = NOW()
        WHERE "userId" = $1
      `, [
        userId,
        inAppEnabled ?? true,
        pushEnabled ?? true,
        smsEnabled ?? false,
        emailEnabled ?? false,
        quietHoursEnabled ?? false,
        quietHoursStart || '22:00',
        quietHoursEnd || '07:00',
        quietHoursTimezone || 'Africa/Lagos',
        allowCriticalOverride ?? true,
        digestEnabled ?? false,
        digestFrequency || 'daily',
        digestTime || '09:00',
        typePreferences ? JSON.stringify(typePreferences) : null
      ])
    } else {
      // Insert new
      const id = `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      await pool.query(`
        INSERT INTO user_notification_preferences (
          id, "userId", "inAppEnabled", "pushEnabled", "smsEnabled", "emailEnabled",
          "quietHoursEnabled", "quietHoursStart", "quietHoursEnd", "quietHoursTimezone",
          "allowCriticalOverride", "digestEnabled", "digestFrequency", "digestTime",
          "typePreferences", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
        id,
        userId,
        inAppEnabled ?? true,
        pushEnabled ?? true,
        smsEnabled ?? false,
        emailEnabled ?? false,
        quietHoursEnabled ?? false,
        quietHoursStart || '22:00',
        quietHoursEnd || '07:00',
        quietHoursTimezone || 'Africa/Lagos',
        allowCriticalOverride ?? true,
        digestEnabled ?? false,
        digestFrequency || 'daily',
        digestTime || '09:00',
        typePreferences ? JSON.stringify(typePreferences) : null
      ])
    }

    logger.info(`Saved notification preferences for user ${userId}`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('Failed to save preferences', { error: error.message })
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// DELETE - Reset to default preferences
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId required' 
      }, { status: 400 })
    }

    const pool = getPool()

    await pool.query(
      `DELETE FROM user_notification_preferences WHERE "userId" = $1`,
      [userId]
    )

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('Failed to reset preferences', { error: error.message })
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
