// Patient Tasks API - PostgreSQL (Neon) Implementation
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PatientTasksAPI')

// GET - Fetch patient tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const assignedBy = searchParams.get('assignedBy')

    const pool = getPool()

    // Build where clause for PostgreSQL
    let conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (patientId) {
      conditions.push(`"patientId" = $${paramIndex++}`)
      params.push(patientId)
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    if (assignedBy) {
      conditions.push(`"assignedBy" = $${paramIndex++}`)
      params.push(assignedBy)
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'
    
    const result = await pool.query(
      `SELECT * FROM patient_tasks WHERE ${whereClause} ORDER BY "scheduledTime" ASC LIMIT 200`,
      params
    )

    return NextResponse.json({ success: true, tasks: result.rows, method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error fetching patient tasks', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new patient task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patient, taskId, taskName, scheduledTime, duration, notes, priority, assignedBy, recurring, recurrenceInterval } = body

    const pool = getPool()
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    await pool.query(`
      INSERT INTO patient_tasks (
        id, "patientId", patient, "taskId", "taskName", "scheduledTime",
        duration, notes, priority, "assignedBy", recurring, "recurrenceInterval", status, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13)
    `, [id, patientId, JSON.stringify(patient || {}), taskId, taskName, scheduledTime, duration, notes, priority || 'routine', assignedBy, recurring || false, recurrenceInterval, now])
    
    logger.info('Patient task created', { id, taskName, patientId })

    // Notification (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'patient_task', title: 'New Task Assigned',
        message: `Task "${taskName}" assigned for patient ${patient?.name || ''}`,
        targetRoles: ['NURSE'], priority: priority || 'normal',
        data: { taskId: id, patientId, taskName }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, task: { id, ...body, status: 'pending', createdAt: now }, method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error creating patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update patient task status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, startedAt, completedAt, completedBy, notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 })
    }

    const pool = getPool()
    const now = new Date()
    const actualStartedAt = startedAt || (status === 'in_progress' ? now : null)
    const actualCompletedAt = completedAt || (status === 'completed' ? now : null)

    await pool.query(`
      UPDATE patient_tasks SET
        status = COALESCE($1, status),
        "startedAt" = COALESCE($2, "startedAt"),
        "completedAt" = COALESCE($3, "completedAt"),
        "completedBy" = COALESCE($4, "completedBy"),
        notes = COALESCE($5, notes)
      WHERE id = $6
    `, [status, actualStartedAt, actualCompletedAt, completedBy, notes, id])

    // Handle recurring tasks
    if (status === 'completed') {
      const taskResult = await pool.query(`SELECT * FROM patient_tasks WHERE id = $1`, [id])
      const task = taskResult.rows[0]
      
      if (task?.recurring && task?.recurrenceInterval) {
        const nextTime = new Date(task.scheduledTime)
        nextTime.setMinutes(nextTime.getMinutes() + task.recurrenceInterval)
        const newId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await pool.query(`
          INSERT INTO patient_tasks (
            id, "patientId", patient, "taskId", "taskName", "scheduledTime",
            duration, notes, priority, "assignedBy", recurring, "recurrenceInterval", status, "createdAt"
          ) SELECT $1, "patientId", patient, "taskId", "taskName", $2, duration, notes, priority, "assignedBy", recurring, "recurrenceInterval", 'pending', $3
          FROM patient_tasks WHERE id = $4
        `, [newId, nextTime, now, id])
        
        logger.info('Created next recurring task', { newId, scheduledTime: nextTime })
      }
    }

    logger.info('Patient task updated', { id, status })
    return NextResponse.json({ success: true, message: 'Task updated successfully', method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error updating patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete patient task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    const pool = getPool()
    await pool.query(`DELETE FROM patient_tasks WHERE id = $1`, [id])

    logger.info('Patient task deleted', { id })
    return NextResponse.json({ success: true, message: 'Task deleted', method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error deleting patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
