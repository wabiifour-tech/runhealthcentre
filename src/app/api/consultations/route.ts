// SIMPLIFIED CONSULTATION API
// Clear workflow: Nurse sends → Doctor reviews → Routes to department
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ConsultationAPI')

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  })
}

// Ensure consultations table exists
async function ensureTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient JSONB,
      
      -- Sender info (who sent the patient)
      sender_id TEXT,
      sender_name TEXT,
      sender_role TEXT,
      
      -- Doctor info
      doctor_id TEXT,
      doctor_name TEXT,
      
      -- SIMPLIFIED: Just the essentials
      chief_complaint TEXT,
      notes TEXT,
      
      -- Status tracking
      status TEXT DEFAULT 'pending',
      
      -- Where patient is being routed
      referred_to TEXT,
      
      -- Timestamps
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
    CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
    CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
  `)
}

// GET - Fetch consultations
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    await ensureTable(pool)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
    
    let query = 'SELECT * FROM consultations WHERE 1=1'
    const params: any[] = []
    let paramCount = 1
    
    if (status) {
      query += ` AND status = $${paramCount++}`
      params.push(status)
    }
    if (doctorId) {
      query += ` AND (doctor_id = $${paramCount} OR doctor_id IS NULL)`
      params.push(doctorId)
      paramCount++
    }
    if (patientId) {
      query += ` AND patient_id = $${paramCount++}`
      params.push(patientId)
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100'
    
    const result = await pool.query(query, params)
    await pool.end()
    
    return NextResponse.json({ success: true, consultations: result.rows })
    
  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching consultations', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new consultation (Nurse sends patient to doctor)
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    await ensureTable(pool)
    
    const body = await request.json()
    
    // Required fields
    if (!body.patientId) {
      return NextResponse.json({ success: false, error: 'Patient ID is required' }, { status: 400 })
    }
    
    const id = `con_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await pool.query(`
      INSERT INTO consultations (
        id, patient_id, patient,
        sender_id, sender_name, sender_role,
        doctor_id, doctor_name,
        chief_complaint, notes,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
    `, [
      id,
      body.patientId,
      JSON.stringify(body.patient || {}),
      body.senderId || null,
      body.senderName || null,
      body.senderRole || null,
      body.doctorId || null,
      body.doctorName || null,
      body.chiefComplaint || '',
      body.notes || null
    ])
    
    // Create notification for doctor(s)
    if (body.doctorId) {
      // Notify specific doctor
      await pool.query(`
        INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
        VALUES ($1, $2, 'new_consultation', $3, $4, $5, FALSE, NOW())
      `, [
        `notif_${Date.now()}`,
        body.doctorId,
        'New Patient Consultation',
        `${body.senderName || 'Nurse'} sent a patient: ${body.chiefComplaint || 'No complaint specified'}`,
        JSON.stringify({ consultationId: id, patientId: body.patientId })
      ])
    } else {
      // Notify all doctors
      const doctors = await pool.query(
        'SELECT id FROM users WHERE role = $1 AND "isActive" = true',
        ['DOCTOR']
      )
      
      for (const doc of doctors.rows) {
        await pool.query(`
          INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
          VALUES ($1, $2, 'new_consultation', $3, $4, $5, FALSE, NOW())
        `, [
          `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          doc.id,
          'New Patient Consultation',
          `${body.senderName || 'Nurse'} sent a patient: ${body.chiefComplaint || 'No complaint specified'}`,
          JSON.stringify({ consultationId: id, patientId: body.patientId })
        ])
      }
    }
    
    await pool.end()
    
    // Broadcast real-time
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'consultation_created',
          data: { id, patientId: body.patientId, chiefComplaint: body.chiefComplaint }
        })
      })
    } catch (e) {}
    
    logger.info('Consultation created', { id, patientId: body.patientId })
    return NextResponse.json({ success: true, id, message: 'Consultation created successfully' })
    
  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating consultation', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update consultation (Doctor reviews, routes to department)
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, status, doctorId, doctorName, referredTo, notes, completedAt } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Consultation ID is required' }, { status: 400 })
    }
    
    // Build update
    const updates: string[] = ['updated_at = NOW()']
    const values: any[] = []
    let paramCount = 1
    
    if (status) {
      updates.push(`status = $${paramCount++}`)
      values.push(status)
    }
    if (doctorId) {
      updates.push(`doctor_id = $${paramCount++}`)
      values.push(doctorId)
    }
    if (doctorName) {
      updates.push(`doctor_name = $${paramCount++}`)
      values.push(doctorName)
    }
    if (referredTo) {
      updates.push(`referred_to = $${paramCount++}`)
      values.push(referredTo)
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`)
      values.push(notes)
    }
    if (completedAt) {
      updates.push(`completed_at = NOW()`)
    }
    
    values.push(id)
    
    await pool.query(
      `UPDATE consultations SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    )
    
    // If routing to a department, create notification and routing request
    if (referredTo && status === 'routed') {
      // Get the consultation
      const consultResult = await pool.query('SELECT * FROM consultations WHERE id = $1', [id])
      const consult = consultResult.rows[0]
      
      // Create routing request
      const routingId = `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await pool.query(`
        INSERT INTO routing_requests (
          id, sender_id, sender_name, sender_role,
          receiver_role, patient_id, patient_name,
          request_type, subject, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'consultation_route', $8, 'pending', NOW())
      `, [
        routingId,
        doctorId,
        doctorName,
        'DOCTOR',
        referredTo.toUpperCase(),
        consult?.patient_id,
        consult?.patient?.firstName ? `${consult.patient.firstName} ${consult.patient.lastName || ''}` : '',
        `Patient routed from consultation: ${consult?.chief_complaint || ''}`
      ])
      
      // Notify users in that role
      const roleUsers = await pool.query(
        'SELECT id FROM users WHERE role = $1 AND "isActive" = true',
        [referredTo.toUpperCase()]
      )
      
      for (const u of roleUsers.rows) {
        await pool.query(`
          INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
          VALUES ($1, $2, 'patient_routed', $3, $4, $5, FALSE, NOW())
        `, [
          `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          u.id,
          `Patient Routed to ${referredTo}`,
          `Dr. ${doctorName} has routed a patient to you`,
          JSON.stringify({ consultationId: id, routingId })
        ])
      }
    }
    
    await pool.end()
    
    // Broadcast real-time
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'consultation_updated',
          data: { id, status, referredTo }
        })
      })
    } catch (e) {}
    
    logger.info('Consultation updated', { id, status, referredTo })
    return NextResponse.json({ success: true, message: 'Consultation updated successfully' })
    
  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating consultation', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete consultation
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }
    
    await pool.query('DELETE FROM consultations WHERE id = $1', [id])
    await pool.end()
    
    return NextResponse.json({ success: true, message: 'Consultation deleted' })
    
  } catch (error: any) {
    await pool.end().catch(() => {})
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
