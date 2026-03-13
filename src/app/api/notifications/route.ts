// Notifications API - Persistent notification storage with role-based support
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Notifications')

// Direct database connection as fallback
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
}

// Ensure notifications table exists
async function ensureNotificationsTable(prisma: any) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      "targetRoles" TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      data JSONB,
      priority TEXT DEFAULT 'normal',
      read BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `)
  
  // Create indexes for faster queries
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")
  `).catch(() => {})
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notifications_targetRoles ON notifications("targetRoles")
  `).catch(() => {})
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)
  `).catch(() => {})
}

// GET - Fetch notifications for a user or by role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Try Prisma first
    const prisma = await getPrisma()
    if (prisma) {
      try {
        await ensureNotificationsTable(prisma)
        const p = prisma as any

        // Build where clause - include both user-specific and role-based notifications
        let conditions = []
        if (userId) {
          conditions.push(`"userId" = '${userId}'`)
        }
        if (userRole) {
          conditions.push(`"targetRoles" LIKE '%${userRole}%'`)
        }
        
        const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'
        const unreadCondition = unreadOnly ? ' AND read = FALSE' : ''

        const notifications = await p.$queryRawUnsafe(`
          SELECT id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt"::text
          FROM notifications
          WHERE (${whereClause})${unreadCondition}
          ORDER BY 
            CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
            "createdAt" DESC
          LIMIT ${limit}
        `)

        // Get unread count
        const unreadCount = await p.$queryRawUnsafe(`
          SELECT COUNT(*)::text as count FROM notifications
          WHERE (${whereClause}) AND read = FALSE
        `)

        return NextResponse.json({
          success: true,
          notifications,
          unreadCount: unreadCount[0]?.count || '0'
        })
      } catch (prismaError: any) {
        logger.warn('Prisma failed, trying direct pg', { error: prismaError.message })
      }
    }

    // Fallback to direct pg
    const pool = getPool()
    try {
      let conditions = []
      if (userId) conditions.push(`"userId" = '${userId}'`)
      if (userRole) conditions.push(`"targetRoles" LIKE '%${userRole}%'`)
      const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'
      const unreadCondition = unreadOnly ? ' AND read = FALSE' : ''

      const result = await pool.query(`
        SELECT id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt"::text
        FROM notifications
        WHERE (${whereClause})${unreadCondition}
        ORDER BY 
          CASE WHEN priority = 'high' THEN 0 ELSE 1 END,
          "createdAt" DESC
        LIMIT $1
      `, [limit])

      const countResult = await pool.query(`
        SELECT COUNT(*)::text as count FROM notifications
        WHERE (${whereClause}) AND read = FALSE
      `)

      await pool.end()
      return NextResponse.json({
        success: true,
        notifications: result.rows,
        unreadCount: countResult.rows[0]?.count || '0'
      })
    } catch (dbError: any) {
      await pool.end()
      logger.error('Database error', { error: dbError.message })
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const dataJson = data ? JSON.stringify(data).replace(/'/g, "''") : null
    const targetRolesStr = targetRoles ? JSON.stringify(targetRoles).replace(/'/g, "''") : null
    const notifPriority = priority || 'normal'

    // Try Prisma first
    const prisma = await getPrisma()
    if (prisma) {
      try {
        await ensureNotificationsTable(prisma)
        const p = prisma as any

        await p.$executeRawUnsafe(`
          INSERT INTO notifications (id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt")
          VALUES (
            '${id}',
            ${userId ? `'${userId}'` : 'NULL'},
            ${targetRolesStr ? `'${targetRolesStr}'` : 'NULL'},
            '${type}',
            '${title.replace(/'/g, "''")}',
            ${message ? `'${message.replace(/'/g, "''")}'` : 'NULL'},
            ${dataJson ? `'${dataJson}'` : 'NULL'},
            '${notifPriority}',
            FALSE,
            '${now}'
          )
        `)

        logger.info('Notification created via Prisma', { id, type })

        // Broadcast to realtime endpoint for immediate notification
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'notification_created',
              data: { notification: { id, type, title, message, targetRoles }, targetRoles }
            })
          })
        } catch {
          // Silent fail
        }

        return NextResponse.json({
          success: true,
          notification: { id, userId, targetRoles, type, title, message, data, priority: notifPriority, read: false, createdAt: now }
        })
      } catch (prismaError: any) {
        logger.warn('Prisma failed, trying direct pg', { error: prismaError.message })
      }
    }

    // Fallback to direct pg
    const pool = getPool()
    try {
      await pool.query(`
        INSERT INTO notifications (id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
      `, [id, userId, targetRolesStr, type, title, message, dataJson, notifPriority, now])

      await pool.end()
      logger.info('Notification created via direct pg', { id, type })

      return NextResponse.json({
        success: true,
        notification: { id, userId, targetRoles, type, title, message, data, priority: notifPriority, read: false, createdAt: now }
      })
    } catch (dbError: any) {
      await pool.end()
      logger.error('Database error', { error: dbError.message })
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Mark as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, userRole, markAllRead } = body

    // Try Prisma first
    const prisma = await getPrisma()
    if (prisma) {
      try {
        const p = prisma as any

        if (markAllRead) {
          // Build conditions for marking all read
          let conditions = []
          if (userId) {
            conditions.push(`"userId" = '${userId}'`)
          }
          if (userRole) {
            conditions.push(`"targetRoles" LIKE '%${userRole}%'`)
          }
          const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'
          
          await p.$executeRawUnsafe(`
            UPDATE notifications SET read = TRUE WHERE (${whereClause}) AND read = FALSE
          `)
          return NextResponse.json({ success: true, message: 'All marked as read' })
        }

        if (id) {
          // Mark specific notification as read
          await p.$executeRawUnsafe(`
            UPDATE notifications SET read = TRUE WHERE id = '${id}'
          `)
          return NextResponse.json({ success: true, message: 'Marked as read' })
        }
      } catch (prismaError: any) {
        logger.warn('Prisma failed, trying direct pg', { error: prismaError.message })
      }
    }

    // Fallback to direct pg
    const pool = getPool()
    try {
      if (markAllRead) {
        let conditions = []
        if (userId) conditions.push(`"userId" = $1`)
        if (userRole) conditions.push(`"targetRoles" LIKE '%' || $2 || '%'`)
        const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1'
        
        await pool.query(`UPDATE notifications SET read = TRUE WHERE (${whereClause}) AND read = FALSE`, [userId, userRole])
        await pool.end()
        return NextResponse.json({ success: true, message: 'All marked as read' })
      }

      if (id) {
        await pool.query(`UPDATE notifications SET read = TRUE WHERE id = $1`, [id])
        await pool.end()
        return NextResponse.json({ success: true, message: 'Marked as read' })
      }

      await pool.end()
      return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })
    } catch (dbError: any) {
      await pool.end()
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

  } catch (error: any) {
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

    // Try Prisma first
    const prisma = await getPrisma()
    if (prisma) {
      try {
        const p = prisma as any

        if (clearAll && userId) {
          await p.$executeRawUnsafe(`
            DELETE FROM notifications WHERE "userId" = '${userId}'
          `)
          return NextResponse.json({ success: true, message: 'All notifications cleared' })
        }

        if (id) {
          await p.$executeRawUnsafe(`
            DELETE FROM notifications WHERE id = '${id}'
          `)
          return NextResponse.json({ success: true, message: 'Notification deleted' })
        }
      } catch (prismaError: any) {
        logger.warn('Prisma failed, trying direct pg', { error: prismaError.message })
      }
    }

    // Fallback to direct pg
    const pool = getPool()
    try {
      if (clearAll && userId) {
        await pool.query(`DELETE FROM notifications WHERE "userId" = $1`, [userId])
        await pool.end()
        return NextResponse.json({ success: true, message: 'All notifications cleared' })
      }

      if (id) {
        await pool.query(`DELETE FROM notifications WHERE id = $1`, [id])
        await pool.end()
        return NextResponse.json({ success: true, message: 'Notification deleted' })
      }

      await pool.end()
      return NextResponse.json({ error: 'id or clearAll required' }, { status: 400 })
    } catch (dbError: any) {
      await pool.end()
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
