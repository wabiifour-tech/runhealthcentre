// Notifications API - Persistent notification storage with role-based support
// Uses PostgreSQL (Neon) for database operations
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
import { NextRequest, NextResponse } from 'next/server'
import { getPool, getPrisma } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Notifications')

// GET - Fetch notifications for a user or by role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const pool = getPool()

    // Build where clause for PostgreSQL
    let conditions: string[] = []
    let paramIndex = 1
    const params: any[] = []
    
    if (userId) {
      conditions.push(`"userId" = $${paramIndex++}`)
      params.push(userId)
    }
    if (userRole) {
      conditions.push(`"targetRoles" LIKE $${paramIndex++}`)
      params.push(`%${userRole}%`)
    }
    
    const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'
    const unreadCondition = unreadOnly ? ' AND read = FALSE' : ''

    // Query notifications
    const query = `
      SELECT id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt"
      FROM notifications
      WHERE (${whereClause})${unreadCondition}
      ORDER BY 
        CASE WHEN priority = 'urgent' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END,
        "createdAt" DESC
      LIMIT $${paramIndex}
    `
    params.push(limit)
    
    const result = await pool.query(query, params)
    const notifications = result.rows

    // Get unread count
    const countParams: any[] = []
    paramIndex = 1
    let countConditions: string[] = []
    
    if (userId) {
      countConditions.push(`"userId" = $${paramIndex++}`)
      countParams.push(userId)
    }
    if (userRole) {
      countConditions.push(`"targetRoles" LIKE $${paramIndex++}`)
      countParams.push(`%${userRole}%`)
    }
    
    const countWhere = countConditions.length > 0 ? countConditions.join(' OR ') : '1=1'
    
    const countQuery = `
      SELECT COUNT(*) as count FROM notifications
      WHERE (${countWhere}) AND read = FALSE
    `
    const countResult = await pool.query(countQuery, countParams)
    const unreadCount = String(countResult.rows[0]?.count || '0')
    
    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount
    })

  } catch (error: any) {
    logger.error('Error fetching notifications', { error: error.message })
    return NextResponse.json({ 
      success: true, 
      notifications: [], 
      unreadCount: '0',
      error: error.message 
    }, { status: 500 })
  }
}

// POST - Create new notification (supports role-based targeting)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetRoles, type, title, message, data, priority } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'type and title required' }, { status: 400 })
    }

    const pool = getPool()
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const dataJson = data ? JSON.stringify(data) : null
    const targetRolesStr = targetRoles ? JSON.stringify(targetRoles) : null
    const notifPriority = priority || 'normal'

    await pool.query(`
      INSERT INTO notifications (id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
    `, [id, userId, targetRolesStr, type, title, message, dataJson, notifPriority, now])
    
    logger.info('Notification created', { id, type })

    return NextResponse.json({
      success: true,
      notification: { id, userId, targetRoles, type, title, message, data, priority: notifPriority, read: false, createdAt: now }
    })

  } catch (error: any) {
    logger.error('Error creating notification', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Mark as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, userRole, markAllRead } = body

    const pool = getPool()

    if (markAllRead) {
      let conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1
      
      if (userId) {
        conditions.push(`"userId" = $${paramIndex++}`)
        params.push(userId)
      }
      if (userRole) {
        conditions.push(`"targetRoles" LIKE $${paramIndex++}`)
        params.push(`%${userRole}%`)
      }
      const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'

      await pool.query(`UPDATE notifications SET read = TRUE WHERE (${whereClause}) AND read = FALSE`, params)
      return NextResponse.json({ success: true, message: 'All marked as read' })
    }

    if (id) {
      await pool.query(`UPDATE notifications SET read = TRUE WHERE id = $1`, [id])
      return NextResponse.json({ success: true, message: 'Marked as read' })
    }

    return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })

  } catch (error: any) {
    logger.error('Error marking notification as read', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const clearAll = searchParams.get('clearAll') === 'true'

    const pool = getPool()

    if (clearAll && userId) {
      await pool.query(`DELETE FROM notifications WHERE "userId" = $1`, [userId])
      return NextResponse.json({ success: true, message: 'All notifications cleared' })
    }

    if (id) {
      await pool.query(`DELETE FROM notifications WHERE id = $1`, [id])
      return NextResponse.json({ success: true, message: 'Notification deleted' })
    }

    return NextResponse.json({ error: 'id or clearAll required' }, { status: 400 })

  } catch (error: any) {
    logger.error('Error deleting notification', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
