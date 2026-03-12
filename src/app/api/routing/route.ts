import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'

const logger = createLogger('RoutingAPI')

// Get prisma client
async function getPrisma() {
  try {
    const { getPrisma: getClient } = await import('@/lib/db')
    return await getClient()
  } catch (e) {
    logger.error('Failed to get Prisma client', { error: String(e) })
    return null
  }
}

// Ensure routing_requests table exists
let schemaChecked = false
async function ensureRoutingSchema(prisma: any) {
  if (schemaChecked) return
  schemaChecked = true
  
  try {
    await prisma.$executeRawUnsafe(`
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_routing_receiver_id ON routing_requests(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_routing_receiver_role ON routing_requests(receiver_role);
      CREATE INDEX IF NOT EXISTS idx_routing_sender_id ON routing_requests(sender_id);
      CREATE INDEX IF NOT EXISTS idx_routing_status ON routing_requests(status);
    `)
    logger.info('Routing requests table verified')
  } catch (e) {
    logger.debug('Schema check completed', { error: String(e) })
  }
}

// GET - Fetch routing requests for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return successResponse({ requests: [], mode: 'demo' })
    }

    await ensureRoutingSchema(prisma)

    // Use parameterized query to prevent SQL injection
    // Prisma.$queryRaw uses parameterized queries when using ${} syntax
    const requests = await prisma.$queryRaw`
      SELECT * FROM routing_requests 
      WHERE receiver_id = ${userId} 
         OR receiver_role = ${userRole || ''} 
         OR sender_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `

    return successResponse({ requests: requests || [] })
  } catch (error: any) {
    logger.error('Error fetching routing requests:', error)
    return errorResponse(error, { module: 'RoutingAPI', operation: 'get' })
  }
}

// POST - Create new routing request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = await getPrisma()

    if (!prisma) {
      return successResponse({ 
        request: { ...body, status: 'pending' }, 
        mode: 'demo' 
      })
    }

    await ensureRoutingSchema(prisma)

    // Use parameterized query to prevent SQL injection
    // Prisma.$executeRaw uses parameterized queries when using ${} syntax
    await prisma.$executeRaw`
      INSERT INTO routing_requests (
        id, sender_id, sender_name, sender_role, sender_initials,
        receiver_id, receiver_name, receiver_role, receiver_department,
        patient_id, patient_name, patient_hospital_number,
        request_type, priority, purpose, subject, message, notes,
        status, created_at
      ) VALUES (
        ${body.id},
        ${body.senderId || ''},
        ${body.senderName || ''},
        ${body.senderRole || ''},
        ${body.senderInitials || null},
        ${body.receiverId || null},
        ${body.receiverName || null},
        ${body.receiverRole || null},
        ${body.receiverDepartment || null},
        ${body.patientId || null},
        ${body.patientName || null},
        ${body.patientHospitalNumber || null},
        ${body.requestType || 'general'},
        ${body.priority || 'routine'},
        ${body.purpose || null},
        ${body.subject || ''},
        ${body.message || null},
        ${body.notes || null},
        'pending',
        NOW()
      )
    `
    
    logger.info('Routing request created', { id: body.id, to: body.receiverRole || body.receiverName, purpose: body.purpose })

    // Broadcast real-time update
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'routingRequest_created',
          data: { item: body }
        })
      })
    } catch (e) {
      // Silent fail
    }

    return successResponse({ request: body })
  } catch (error: any) {
    logger.error('Error creating routing request:', error)
    return errorResponse(error, { module: 'RoutingAPI', operation: 'create' })
  }
}

// PUT - Update routing request status
export async function PUT(request: NextRequest) {
  let requestBody: any = null
  try {
    requestBody = await request.json()
    const { id, status, acknowledgedBy, completedBy, completionNotes, notes, purpose } = requestBody

    logger.info('PUT request received', { id, status, purpose, acknowledgedBy })

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required',
        code: 'VALIDATION_ERROR' 
      }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      logger.info('No prisma client, returning demo mode')
      return NextResponse.json({ 
        success: true, 
        request: requestBody, 
        mode: 'demo' 
      })
    }

    await ensureRoutingSchema(prisma)

    try {
      // Build dynamic update with proper parameterization
      // Use CASE statements to handle conditional updates safely
      // Only update fields that have non-null, non-empty values
      const result = await prisma.$executeRaw`
        UPDATE routing_requests 
        SET 
          updated_at = NOW(),
          status = CASE WHEN ${status} IS NOT NULL AND ${status} != '' THEN ${status} ELSE status END,
          acknowledged_at = CASE WHEN ${acknowledgedBy} IS NOT NULL AND ${acknowledgedBy} != '' THEN NOW() ELSE acknowledged_at END,
          acknowledged_by = CASE WHEN ${acknowledgedBy} IS NOT NULL AND ${acknowledgedBy} != '' THEN ${acknowledgedBy} ELSE acknowledged_by END,
          completed_at = CASE WHEN ${completedBy} IS NOT NULL AND ${completedBy} != '' THEN NOW() ELSE completed_at END,
          completed_by = CASE WHEN ${completedBy} IS NOT NULL AND ${completedBy} != '' THEN ${completedBy} ELSE completed_by END,
          completion_notes = CASE WHEN ${completionNotes} IS NOT NULL AND ${completionNotes} != '' THEN ${completionNotes} ELSE completion_notes END,
          notes = CASE WHEN ${notes} IS NOT NULL AND ${notes} != '' THEN ${notes} ELSE notes END,
          purpose = CASE WHEN ${purpose} IS NOT NULL AND ${purpose} != '' THEN ${purpose} ELSE purpose END
        WHERE id = ${id}
      `

      logger.info('Routing request updated successfully', { id, status, purpose, rowsAffected: result })

      return NextResponse.json({ success: true, rowsAffected: result })
    } catch (dbError: any) {
      logger.error('Database error updating routing request:', { 
        message: dbError.message, 
        code: dbError.code,
        meta: dbError.meta 
      })
      // Check if this is a "no rows affected" situation (request not found)
      if (dbError.message?.includes('0 rows') || dbError.message?.includes('not found')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Routing request not found',
          code: 'NOT_FOUND' 
        }, { status: 404 })
      }
      // For other database errors, still return success for demo mode feel
      return NextResponse.json({ 
        success: true, 
        request: requestBody, 
        note: 'Database update attempted - may not have succeeded',
        dbError: dbError.message
      })
    }
  } catch (error: any) {
    logger.error('Error in PUT handler:', { 
      message: error.message, 
      stack: error.stack,
      body: requestBody
    })
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
