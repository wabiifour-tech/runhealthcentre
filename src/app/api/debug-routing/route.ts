// Debug endpoint for routing API
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get Prisma client
    const { getPrisma } = await import('@/lib/db')
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ error: 'No prisma client', body })
    }

    // Check if table exists
    let tableExists = false
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'routing_requests'
        );
      `
      tableExists = result[0]?.exists || false
    } catch (e: any) {
      return NextResponse.json({ error: 'Table check failed', details: e.message, body })
    }

    if (!tableExists) {
      // Try to create the table
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
          )
        `)
        return NextResponse.json({ message: 'Table created', body })
      } catch (e: any) {
        return NextResponse.json({ error: 'Table creation failed', details: e.message, body })
      }
    }

    // Try the insert with detailed error capture
    try {
      await prisma.$executeRaw`
        INSERT INTO routing_requests (
          id, sender_id, sender_name, sender_role, sender_initials,
          receiver_id, receiver_name, receiver_role, receiver_department,
          patient_id, patient_name, patient_hospital_number,
          request_type, priority, purpose, subject, message, notes,
          status, created_at
        ) VALUES (
          ${body.id || `debug_${Date.now()}`},
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
          ${body.subject || 'Debug test'},
          ${body.message || null},
          ${body.notes || null},
          'pending',
          NOW()
        )
      `
      return NextResponse.json({ success: true, message: 'Insert successful', body })
    } catch (insertError: any) {
      return NextResponse.json({ 
        error: 'Insert failed', 
        errorMessage: insertError.message,
        errorCode: insertError.code,
        errorMeta: insertError.meta,
        body
      })
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Handler error', 
      message: error.message,
      stack: error.stack
    })
  }
}
