// Notifications API - Persistent notification storage
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

// Ensure notifications table exists
async function ensureNotificationsTable(prisma: any) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      data JSONB,
      read BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `)
  
  // Create index for faster queries
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")
  `).catch(() => {})
}

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' }, { status: 500 })

    await ensureNotificationsTable(prisma)
    const p = prisma as any

    let whereClause = userId ? `"userId" = '${userId}'` : '1=1'
    if (unreadOnly) whereClause += ' AND read = FALSE'

    const notifications = await p.$queryRawUnsafe(`
      SELECT id, "userId", type, title, message, data, read, "createdAt"::text
      FROM notifications
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `)

    // Get unread count
    const unreadCount = await p.$queryRawUnsafe(`
      SELECT COUNT(*)::text as count FROM notifications
      WHERE ${userId ? `"userId" = '${userId}'` : '1=1'} AND read = FALSE
    `)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount[0]?.count || '0'
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'type and title required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' }, { status: 500 })

    await ensureNotificationsTable(prisma)
    const p = prisma as any

    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const dataJson = data ? JSON.stringify(data).replace(/'/g, "''") : null

    await p.$executeRawUnsafe(`
      INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
      VALUES (
        '${id}',
        ${userId ? `'${userId}'` : 'NULL'},
        '${type}',
        '${title.replace(/'/g, "''")}',
        ${message ? `'${message.replace(/'/g, "''")}'` : 'NULL'},
        ${dataJson ? `'${dataJson}'` : 'NULL'},
        FALSE,
        '${now}'
      )
    `)

    // Fetch created notification
    const result = await p.$queryRawUnsafe(`
      SELECT id, "userId", type, title, message, data, read, "createdAt"::text
      FROM notifications WHERE id = '${id}'
    `)

    return NextResponse.json({
      success: true,
      notification: Array.isArray(result) ? result[0] : result
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Mark as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, markAllRead } = body

    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' }, { status: 500 })

    const p = prisma as any

    if (markAllRead && userId) {
      // Mark all as read for user
      await p.$executeRawUnsafe(`
        UPDATE notifications SET read = TRUE WHERE "userId" = '${userId}' AND read = FALSE
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

    return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 })

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

    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' }, { status: 500 })

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

    return NextResponse.json({ error: 'id or clearAll required' }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
