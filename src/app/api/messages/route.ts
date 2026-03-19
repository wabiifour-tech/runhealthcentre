// Messages API - Persistent messaging system
// All messages are stored in database, no in-memory storage
import { NextRequest } from 'next/server'
import { getPool } from '@/lib/db'
import { successResponse, errorResponse, Errors } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Messages')

// GET - Retrieve messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const conversationId = searchParams.get('conversationId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    const pool = getPool()

    if (conversationId) {
      // Get messages for specific conversation
      const result = await pool.query(`
        SELECT * FROM messages 
        WHERE "conversationId" = $1 
        ORDER BY "createdAt" DESC 
        LIMIT $2
      `, [conversationId, limit])

      return successResponse({
        messages: result.rows,
        count: result.rows.length
      })
    }

    if (userId) {
      // Get messages for user (as sender or recipient)
      let query = `
        SELECT * FROM messages 
        WHERE "senderId" = $1 OR "recipientId" = $1
      `
      const params: any[] = [userId]

      if (unreadOnly) {
        query += ` AND "isRead" = false`
      }

      query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await pool.query(query, params)

      // Get unread count
      const unreadResult = await pool.query(`
        SELECT COUNT(*) as count FROM messages 
        WHERE "recipientId" = $1 AND "isRead" = false
      `, [userId])

      return successResponse({
        messages: result.rows,
        unreadCount: parseInt(unreadResult.rows[0]?.count || '0'),
        count: result.rows.length
      })
    }

    // Get all messages (admin only)
    const result = await pool.query(`
      SELECT * FROM messages 
      ORDER BY "createdAt" DESC 
      LIMIT $1
    `, [limit])

    return successResponse({
      messages: result.rows,
      count: result.rows.length
    })

  } catch (error: any) {
    logger.error('Failed to get messages', { error: error.message })
    return errorResponse(error, { module: 'Messages', operation: 'get' })
  }
}

// POST - Create new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversationId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientRole,
      subject,
      content,
      priority = 'normal',
      category = 'message',
      patientId,
      patientName,
      threadId,
      parentId
    } = body

    // Validate required fields
    if (!senderId || !senderName || !content) {
      throw Errors.validation('senderId, senderName, and content are required')
    }

    const pool = getPool()
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdAt = new Date()

    // Create conversation if not exists
    let convId = conversationId
    if (!convId) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await pool.query(`
        INSERT INTO conversations (id, type, "createdBy", "lastMessageAt")
        VALUES ($1, $2, $3, $4)
      `, [convId, recipientId ? 'direct' : 'broadcast', senderId, createdAt])

      // Add sender as participant
      await pool.query(`
        INSERT INTO conversation_participants (id, "conversationId", "userId", "userName", "userRole")
        VALUES ($1, $2, $3, $4, $5)
      `, [`cp_${Date.now()}_1`, convId, senderId, senderName, senderRole || 'staff'])

      // Add recipient as participant if direct message
      if (recipientId) {
        await pool.query(`
          INSERT INTO conversation_participants (id, "conversationId", "userId")
          VALUES ($1, $2, $3)
        `, [`cp_${Date.now()}_2`, convId, recipientId])
      }
    }

    // Insert message
    await pool.query(`
      INSERT INTO messages (
        id, "conversationId", "senderId", "senderName", "senderRole",
        "recipientId", "recipientRole", subject, content, priority,
        category, "patientId", "patientName", "threadId", "parentId",
        "isRead", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      id, convId, senderId, senderName, senderRole,
      recipientId, recipientRole, subject, content, priority,
      category, patientId, patientName, threadId, parentId,
      false, createdAt
    ])

    // Update conversation last message
    await pool.query(`
      UPDATE conversations 
      SET "lastMessageAt" = $1, "lastMessagePreview" = $2, "updatedAt" = $1
      WHERE id = $3
    `, [createdAt, content.substring(0, 100), convId])

    logger.info('Message created', { id, conversationId: convId, senderId })

    return successResponse({
      id,
      conversationId: convId,
      senderId,
      senderName,
      recipientId,
      subject,
      content,
      priority,
      category,
      isRead: false,
      createdAt: createdAt.toISOString()
    })

  } catch (error: any) {
    logger.error('Failed to create message', { error: error.message })
    return errorResponse(error, { module: 'Messages', operation: 'create' })
  }
}

// PUT - Mark as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, userId, markAllRead } = body

    const pool = getPool()

    if (markAllRead && userId) {
      // Mark all messages for user as read
      await pool.query(`
        UPDATE messages 
        SET "isRead" = true, "readAt" = $1
        WHERE "recipientId" = $2 AND "isRead" = false
      `, [new Date(), userId])

      logger.info('All messages marked as read', { userId })

      return successResponse({ message: 'All messages marked as read' })
    }

    if (messageId) {
      // Mark specific message as read
      const result = await pool.query(`
        UPDATE messages 
        SET "isRead" = true, "readAt" = $1
        WHERE id = $2
        RETURNING *
      `, [new Date(), messageId])

      if (result.rows.length === 0) {
        throw Errors.notFound('Message')
      }

      logger.info('Message marked as read', { messageId })

      return successResponse({ message: result.rows[0] })
    }

    throw Errors.validation('messageId or markAllRead with userId required')

  } catch (error: any) {
    logger.error('Failed to update message', { error: error.message })
    return errorResponse(error, { module: 'Messages', operation: 'update' })
  }
}

// DELETE - Delete message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      throw Errors.validation('Message ID required')
    }

    const pool = getPool()

    const result = await pool.query(`
      DELETE FROM messages WHERE id = $1 RETURNING *
    `, [messageId])

    if (result.rows.length === 0) {
      throw Errors.notFound('Message')
    }

    logger.info('Message deleted', { messageId })

    return successResponse({ message: 'Message deleted', id: messageId })

  } catch (error: any) {
    logger.error('Failed to delete message', { error: error.message })
    return errorResponse(error, { module: 'Messages', operation: 'delete' })
  }
}
