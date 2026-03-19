// UNIFIED ROUTING API - Handles ALL cross-role communications
// This is the SINGLE source of truth for routing requests between all roles
// PostgreSQL (Neon) version
// UPDATED: SuperAdmin can communicate with ALL roles and ALL roles can communicate with SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import { getPool, getPrisma } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'

const logger = createLogger('RoutingAPI')

// Broadcast to realtime endpoint
async function broadcastRoutingEvent(event: string, data: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    })
  } catch (e) {
    // Silent fail
  }
}

// GET - Fetch routing requests for current user
// SUPER_ADMIN can see ALL routing requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const type = searchParams.get('type') || 'all' // 'incoming', 'outgoing', 'all'

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const pool = getPool()
    let query = ''
    let params: any[] = []
    
    // SUPER_ADMIN can see ALL routing requests
    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    
    if (isSuperAdmin && type === 'all') {
      // SuperAdmin sees everything
      query = `
        SELECT * FROM routing_requests 
        ORDER BY created_at DESC
        LIMIT 500
      `
      params = []
    } else if (isSuperAdmin && type === 'incoming') {
      // SuperAdmin incoming (requests sent TO them or SUPER_ADMIN role)
      query = `
        SELECT * FROM routing_requests 
        WHERE receiver_id = $1 
           OR receiver_role = 'SUPER_ADMIN'
           OR receiver_role = $2
        ORDER BY created_at DESC
        LIMIT 200
      `
      params = [userId, userRole || '']
    } else if (type === 'incoming') {
      // Regular user incoming - also include requests from SUPER_ADMIN to their role
      query = `
        SELECT * FROM routing_requests 
        WHERE (receiver_id = $1 OR receiver_role = $2)
          AND sender_id != $3
        ORDER BY created_at DESC
        LIMIT 100
      `
      params = [userId, userRole || '', userId]
    } else if (type === 'outgoing') {
      query = `
        SELECT * FROM routing_requests 
        WHERE sender_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `
      params = [userId]
    } else {
      // All - include messages TO and FROM user, plus SUPER_ADMIN broadcasts
      query = `
        SELECT * FROM routing_requests 
        WHERE receiver_id = $1 
           OR receiver_role = $2 
           OR sender_id = $3
           OR (sender_role = 'SUPER_ADMIN' AND receiver_role = $2)
           OR (receiver_role = 'SUPER_ADMIN' AND sender_id = $3)
        ORDER BY created_at DESC
        LIMIT 200
      `
      params = [userId, userRole || '', userId]
    }

    const result = await pool.query(query, params)

    logger.info('Routing requests fetched', { userId, userRole, type, count: result.rows.length, isSuperAdmin })
    return successResponse({ requests: result.rows })

  } catch (error: any) {
    logger.error('Error fetching routing requests', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'get' })
  }
}

// POST - Create new routing request (send file/request to another role)
// SUPER_ADMIN can send to ANY role, ANY role can send to SUPER_ADMIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pool = getPool()
    
    // Validate required fields
    if (!body.senderId || !body.senderName || !body.senderRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sender information is required (senderId, senderName, senderRole)' 
      }, { status: 400 })
    }
    
    if (!body.subject) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subject is required' 
      }, { status: 400 })
    }
    
    // Must have at least one receiver target
    if (!body.receiverId && !body.receiverRole && !body.receiverDepartment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please specify a receiver (receiverId, receiverRole, or receiverDepartment)' 
      }, { status: 400 })
    }

    const isSuperAdmin = body.senderRole === 'SUPER_ADMIN'
    const isToSuperAdmin = body.receiverRole === 'SUPER_ADMIN'

    const id = body.id || `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    // Insert the routing request
    await pool.query(`
      INSERT INTO routing_requests (
        id, sender_id, sender_name, sender_role, sender_initials,
        receiver_id, receiver_name, receiver_role, receiver_department,
        patient_id, patient_name, patient_hospital_number,
        request_type, priority, subject, message, notes,
        consultation_id, lab_request_id, prescription_id,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending', $21, $22)
    `, [
      id,
      body.senderId,
      body.senderName,
      body.senderRole,
      body.senderInitials || null,
      body.receiverId || null,
      body.receiverName || null,
      body.receiverRole || null,
      body.receiverDepartment || null,
      body.patientId || null,
      body.patientName || null,
      body.patientHospitalNumber || null,
      body.requestType || 'general',
      body.priority || 'routine',
      body.subject,
      body.message || null,
      body.notes || null,
      body.consultationId || null,
      body.labRequestId || null,
      body.prescriptionId || null,
      now,
      now
    ])

    logger.info('Routing request created', { 
      id, 
      from: `${body.senderName} (${body.senderRole})`,
      to: body.receiverName || body.receiverRole || body.receiverDepartment,
      subject: body.subject,
      isSuperAdmin,
      isToSuperAdmin
    })

    // Create notification for receiver(s)
    try {
      const title = `New ${body.requestType || 'request'} from ${body.senderName}`
      const messageBody = body.patientName 
        ? `${body.senderName} (${body.senderRole}) sent: ${body.subject} - Patient: ${body.patientName}`
        : `${body.senderName} (${body.senderRole}) sent: ${body.subject}`

      if (body.receiverId) {
        // Send to specific user
        await pool.query(`
          INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)
        `, [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          body.receiverId,
          body.requestType || 'request',
          title,
          messageBody,
          JSON.stringify({ requestId: id }),
          body.priority || 'normal',
          now
        ])
      } else if (isToSuperAdmin) {
        // Send to ALL SUPER_ADMIN users
        const superAdminsResult = await pool.query(
          `SELECT id FROM users WHERE role = 'SUPER_ADMIN' AND "isActive" = TRUE`, 
          []
        )
        
        for (const u of superAdminsResult.rows) {
          await pool.query(`
            INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)
          `, [
            `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            u.id,
            body.requestType || 'request',
            title,
            messageBody,
            JSON.stringify({ requestId: id }),
            body.priority || 'normal',
            now
          ])
        }
        logger.info(`Notification sent to ${superAdminsResult.rows.length} SUPER_ADMIN users`)
      } else if (body.receiverRole) {
        // Notify all users with that role
        const usersResult = await pool.query(
          `SELECT id FROM users WHERE role = $1 AND "isActive" = TRUE`, 
          [body.receiverRole]
        )
        
        for (const u of usersResult.rows) {
          await pool.query(`
            INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)
          `, [
            `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            u.id,
            body.requestType || 'request',
            title,
            messageBody,
            JSON.stringify({ requestId: id }),
            body.priority || 'normal',
            now
          ])
        }
        logger.info(`Notification sent to ${usersResult.rows.length} users with role ${body.receiverRole}`)
      }

      // If SuperAdmin is sending, also create a broadcast notification
      if (isSuperAdmin && body.receiverRole && body.receiverRole !== 'SUPER_ADMIN') {
        logger.info(`SUPER_ADMIN broadcast to ${body.receiverRole}`)
      }

    } catch (notifError) {
      logger.warn('Failed to create notification', { error: String(notifError) })
    }

    // Fetch the created request to return
    const result = await pool.query(`SELECT * FROM routing_requests WHERE id = $1`, [id])

    // Broadcast real-time update
    await broadcastRoutingEvent('routing_created', result.rows[0])

    return successResponse({ 
      request: result.rows[0],
      message: `Request sent to ${body.receiverName || body.receiverRole || body.receiverDepartment} successfully!`
    })

  } catch (error: any) {
    logger.error('Error creating routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'create' })
  }
}

// PUT - Update routing request (acknowledge, complete, update status)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, acknowledgedBy, completedBy, completionNotes, notes, priority } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    const pool = getPool()

    // Get original request for notification
    const originalResult = await pool.query(`SELECT * FROM routing_requests WHERE id = $1`, [id])
    const original = originalResult.rows[0]

    if (!original) {
      return NextResponse.json({ 
        success: false, 
        error: 'Routing request not found' 
      }, { status: 404 })
    }

    const now = new Date()

    // Build update query dynamically
    const updates: string[] = ['updated_at = $1']
    const values: any[] = [now]
    let paramIndex = 2

    if (status) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (acknowledgedBy) {
      updates.push(`acknowledged_at = $${paramIndex++}`)
      updates.push(`acknowledged_by = $${paramIndex++}`)
      values.push(now, acknowledgedBy)
    }
    if (completedBy) {
      updates.push(`completed_at = $${paramIndex++}`)
      updates.push(`completed_by = $${paramIndex++}`)
      values.push(now, completedBy)
    }
    if (completionNotes) {
      updates.push(`completion_notes = $${paramIndex++}`)
      values.push(completionNotes)
    }
    if (notes) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(notes)
    }
    if (priority) {
      updates.push(`priority = $${paramIndex++}`)
      values.push(priority)
    }

    values.push(id)
    
    await pool.query(`UPDATE routing_requests SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values)

    logger.info('Routing request updated', { id, status, acknowledgedBy, completedBy })

    // Send notification to original sender about status change
    if (acknowledgedBy && original.sender_id) {
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'normal', FALSE, $7)
      `, [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        original.sender_id,
        'request_acknowledged',
        `${acknowledgedBy} acknowledged your request`,
        `Your request "${original.subject}" has been acknowledged by ${acknowledgedBy}`,
        JSON.stringify({ requestId: id }),
        now
      ])
    }

    if (completedBy && original.sender_id) {
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'normal', FALSE, $7)
      `, [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        original.sender_id,
        'request_completed',
        `${completedBy} completed your request`,
        `Your request "${original.subject}" has been completed by ${completedBy}${completionNotes ? `: ${completionNotes}` : ''}`,
        JSON.stringify({ requestId: id, completionNotes }),
        now
      ])
    }

    // Fetch updated request
    const updatedResult = await pool.query(`SELECT * FROM routing_requests WHERE id = $1`, [id])

    // Broadcast real-time update
    await broadcastRoutingEvent('routing_updated', updatedResult.rows[0])

    return successResponse({ 
      request: updatedResult.rows[0],
      message: 'Routing request updated successfully'
    })

  } catch (error: any) {
    logger.error('Error updating routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'update' })
  }
}

// DELETE - Delete a routing request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    const pool = getPool()
    await pool.query(`DELETE FROM routing_requests WHERE id = $1`, [id])

    logger.info('Routing request deleted', { id })
    
    // Broadcast real-time update
    await broadcastRoutingEvent('routing_deleted', { id })

    return successResponse({ message: 'Routing request deleted successfully' })

  } catch (error: any) {
    logger.error('Error deleting routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'delete' })
  }
}
