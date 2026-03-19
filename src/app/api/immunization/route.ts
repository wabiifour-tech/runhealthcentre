// Immunization Records API - PostgreSQL (Neon) Implementation
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ImmunizationAPI')

// GET - Fetch immunization records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const vaccineName = searchParams.get('vaccineName')

    const pool = getPool()

    // Build where clause for PostgreSQL
    let conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (patientId) {
      conditions.push(`"patientId" = $${paramIndex++}`)
      params.push(patientId)
    }
    if (vaccineName) {
      conditions.push(`LOWER("vaccineName") LIKE LOWER($${paramIndex++})`)
      params.push(`%${vaccineName}%`)
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'
    
    const result = await pool.query(
      `SELECT * FROM immunization_records WHERE ${whereClause} ORDER BY "administeredAt" DESC LIMIT 200`,
      params
    )

    return NextResponse.json({ success: true, records: result.rows, method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error fetching immunization records', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new immunization record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patient, vaccineName, doseNumber, batchNumber, administeredBy, administeredAt, nextDoseDate, reactions, notes } = body

    const pool = getPool()
    const id = `imm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const adminTime = administeredAt ? new Date(administeredAt) : now

    await pool.query(`
      INSERT INTO immunization_records (
        id, "patientId", "vaccineName", "doseNumber", "batchNumber",
        "administeredBy", "administeredAt", "nextDoseDate", reactions, notes, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, patientId, vaccineName, doseNumber || 1, batchNumber, administeredBy, adminTime, nextDoseDate ? new Date(nextDoseDate) : null, reactions, notes, now])
    
    logger.info('Immunization record created', { id, vaccineName, patientId })

    // Create task reminder if next dose date exists (non-blocking)
    if (nextDoseDate) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patient-tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, patient, taskId: 'vaccination_reminder',
          taskName: `${vaccineName} Dose ${(doseNumber || 0) + 1} Reminder`,
          scheduledTime: nextDoseDate, priority: 'routine',
          notes: `Follow-up vaccination for ${vaccineName}`, assignedBy: administeredBy
        })
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, record: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error creating immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete immunization record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    const pool = getPool()
    await pool.query(`DELETE FROM immunization_records WHERE id = $1`, [id])

    logger.info('Immunization record deleted', { id })
    return NextResponse.json({ success: true, message: 'Record deleted', method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error deleting immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
