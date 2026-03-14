// UNIFIED ROUTING API - Handles ALL cross-role communications
// This is the SINGLE source of truth for routing requests between all roles
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'

const logger = createLogger('RoutingAPI')

// Direct database connection
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  })
}

// Ensure routing_requests table exists with all columns
async function ensureTable(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS routing_requests (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        sender_initials TEXT,
        receiver_id TEXT,
        receiver_name TEXT,
        receiver_role TEXT,
        receiver_department TEXT,
        patient_id TEXT,
        patient_name TEXT,
        patient_hospital_number TEXT,
        request_type TEXT NOT NULL,
        priority TEXT DEFAULT 'routine',
        purpose TEXT,
        subject TEXT NOT NULL,
        message TEXT,
        notes TEXT,
        consultation_id TEXT,
        lab_request_id TEXT,
        prescription_id TEXT,
        status TEXT DEFAULT 'pending',
        acknowledged_at TIMESTAMP,
        acknowledged_by TEXT,
        completed_at TIMESTAMP,
        completed_by TEXT,
        completion_notes TEXT,
        seen_by TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_routing_receiver_id ON routing_requests(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_routing_receiver_role ON routing_requests(receiver_role);
      CREATE INDEX IF NOT EXISTS idx_routing_sender_id ON routing_requests(sender_id);
      CREATE INDEX IF NOT EXISTS idx_routing_status ON routing_requests(status);
    `)
    logger.info('Routing table verified/created')
  } catch (e) {
    logger.debug('Table check completed', { error: String(e) })
  }
}

// Create notification in database
async function createRoutingNotification(pool: Pool, data: {
  senderName: string
  senderRole: string
  receiverId?: string
  receiverRole?: string
  patientName?: string
  subject: string
  requestType: string
  requestId: string
  priority?: string
}) {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const title = `New ${data.requestType} from ${data.senderName}`
    const message = data.patientName 
      ? `${data.senderName} (${data.senderRole}) sent: ${data.subject} - Patient: ${data.patientName}`
      : `${data.senderName} (${data.senderRole}) sent: ${data.subject}`

    // If specific receiver, notify them directly
    if (data.receiverId) {
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
      `, [id, data.receiverId, data.requestType, title, message, JSON.stringify({ requestId: data.requestId }), data.priority || 'normal'])
      logger.info('Notification created for specific user', { userId: data.receiverId, requestId: data.requestId })
    }
    
    // If receiver by role, notify ALL users with that role
    if (data.receiverRole && !data.receiverId) {
      const usersResult = await pool.query(
        'SELECT id FROM users WHERE role = $1 AND "isActive" = true',
        [data.receiverRole]
      )
      
      for (const u of usersResult.rows) {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await pool.query(`
          INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
        `, [notifId, u.id, data.requestType, title, message, JSON.stringify({ requestId: data.requestId }), data.priority || 'normal'])
      }
      logger.info('Notifications created for role', { role: data.receiverRole, count: usersResult.rows.length, requestId: data.requestId })
    }
  } catch (error) {
    logger.error('Failed to create notification', { error: String(error) })
  }
}

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
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    await ensureTable(pool)
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const type = searchParams.get('type') || 'all' // 'incoming', 'outgoing', 'all'

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    let query = ''
    
    if (type === 'incoming') {
      // Requests sent TO this user (by ID or by role)
      query = `
        SELECT * FROM routing_requests 
        WHERE (receiver_id = $1 OR receiver_role = $2)
          AND sender_id != $1
        ORDER BY created_at DESC
        LIMIT 100
      `
    } else if (type === 'outgoing') {
      // Requests sent BY this user
      query = `
        SELECT * FROM routing_requests 
        WHERE sender_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `
    } else {
      // All requests related to this user
      query = `
        SELECT * FROM routing_requests 
        WHERE receiver_id = $1 
           OR receiver_role = $2 
           OR sender_id = $1
        ORDER BY created_at DESC
        LIMIT 200
      `
    }

    const result = await pool.query(query, [userId, userRole || ''])
    await pool.end()

    logger.info('Routing requests fetched', { userId, userRole, type, count: result.rows.length })
    return successResponse({ requests: result.rows })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching routing requests', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'get' })
  }
}

// POST - Create new routing request (send file/request to another role)
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    await ensureTable(pool)
    
    const body = await request.json()
    
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

    const id = body.id || `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    // Insert the routing request
    await pool.query(`
      INSERT INTO routing_requests (
        id, sender_id, sender_name, sender_role, sender_initials,
        receiver_id, receiver_name, receiver_role, receiver_department,
        patient_id, patient_name, patient_hospital_number,
        request_type, priority, purpose, subject, message, notes,
        consultation_id, lab_request_id, prescription_id,
        status, seen_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending', '[]', $22, $22)
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
      body.purpose || null,
      body.subject,
      body.message || null,
      body.notes || null,
      body.consultationId || null,
      body.labRequestId || null,
      body.prescriptionId || null,
      now
    ])

    logger.info('Routing request created', { 
      id, 
      from: `${body.senderName} (${body.senderRole})`,
      to: body.receiverName || body.receiverRole || body.receiverDepartment,
      subject: body.subject
    })

    // Create notification for receiver(s)
    await createRoutingNotification(pool, {
      senderName: body.senderName,
      senderRole: body.senderRole,
      receiverId: body.receiverId,
      receiverRole: body.receiverRole,
      patientName: body.patientName,
      subject: body.subject,
      requestType: body.requestType || 'request',
      requestId: id,
      priority: body.priority
    })

    // Fetch the created request to return
    const result = await pool.query('SELECT * FROM routing_requests WHERE id = $1', [id])
    await pool.end()

    // Broadcast real-time update
    await broadcastRoutingEvent('routing_created', result.rows[0])

    return successResponse({ 
      request: result.rows[0],
      message: `Request sent to ${body.receiverName || body.receiverRole || body.receiverDepartment} successfully!`
    })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'create' })
  }
}

// PUT - Update routing request (acknowledge, complete, update status)
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    await ensureTable(pool)
    
    const body = await request.json()
    const { id, status, acknowledgedBy, completedBy, completionNotes, notes, purpose, seenBy } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    // Get original request for notification
    const originalResult = await pool.query('SELECT * FROM routing_requests WHERE id = $1', [id])
    const original = originalResult.rows[0]

    if (!original) {
      await pool.end()
      return NextResponse.json({ 
        success: false, 
        error: 'Routing request not found' 
      }, { status: 404 })
    }

    // Build update query dynamically
    const updates: string[] = ['updated_at = NOW()']
    const values: any[] = []
    let paramCount = 1

    if (status) {
      updates.push(`status = $${paramCount++}`)
      values.push(status)
    }
    if (acknowledgedBy) {
      updates.push(`acknowledged_at = NOW()`)
      updates.push(`acknowledged_by = $${paramCount++}`)
      values.push(acknowledgedBy)
    }
    if (completedBy) {
      updates.push(`completed_at = NOW()`)
      updates.push(`completed_by = $${paramCount++}`)
      values.push(completedBy)
    }
    if (completionNotes) {
      updates.push(`completion_notes = $${paramCount++}`)
      values.push(completionNotes)
    }
    if (notes) {
      updates.push(`notes = $${paramCount++}`)
      values.push(notes)
    }
    if (purpose) {
      updates.push(`purpose = $${paramCount++}`)
      values.push(purpose)
    }
    if (seenBy) {
      updates.push(`seen_by = $${paramCount++}`)
      values.push(JSON.stringify(seenBy))
    }

    values.push(id)
    
    await pool.query(
      `UPDATE routing_requests SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    logger.info('Routing request updated', { id, status, acknowledgedBy, completedBy })

    // Send notification to original sender about status change
    if (acknowledgedBy && original.sender_id) {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'normal', FALSE, NOW())
      `, [
        notifId,
        original.sender_id,
        'request_acknowledged',
        `${acknowledgedBy} acknowledged your request`,
        `Your request "${original.subject}" has been acknowledged by ${acknowledgedBy}`,
        JSON.stringify({ requestId: id })
      ])
    }

    if (completedBy && original.sender_id) {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, priority, read, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'normal', FALSE, NOW())
      `, [
        notifId,
        original.sender_id,
        'request_completed',
        `${completedBy} completed your request`,
        `Your request "${original.subject}" has been completed by ${completedBy}${completionNotes ? `: ${completionNotes}` : ''}`,
        JSON.stringify({ requestId: id, completionNotes })
      ])
    }

    // Fetch updated request
    const updatedResult = await pool.query('SELECT * FROM routing_requests WHERE id = $1', [id])
    await pool.end()

    // Broadcast real-time update
    await broadcastRoutingEvent('routing_updated', updatedResult.rows[0])

    return successResponse({ 
      request: updatedResult.rows[0],
      message: 'Routing request updated successfully'
    })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'update' })
  }
}

// DELETE - Delete a routing request
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      await pool.end()
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    await pool.query('DELETE FROM routing_requests WHERE id = $1', [id])
    await pool.end()

    logger.info('Routing request deleted', { id })
    
    // Broadcast real-time update
    await broadcastRoutingEvent('routing_deleted', { id })

    return successResponse({ message: 'Routing request deleted successfully' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error deleting routing request', { error: error.message })
    return errorResponse(error, { module: 'RoutingAPI', operation: 'delete' })
  }
}
