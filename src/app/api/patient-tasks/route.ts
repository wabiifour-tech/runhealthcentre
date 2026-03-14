// Patient Tasks API - BULLETPROOF Implementation
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PatientTasksAPI')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// Ensure table exists
async function ensureTable(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_tasks (
        id TEXT PRIMARY KEY,
        "patientId" TEXT,
        patient JSON,
        "taskId" TEXT,
        "taskName" TEXT,
        "scheduledTime" TEXT,
        duration INTEGER,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'routine',
        "assignedBy" TEXT,
        "startedAt" TEXT,
        "completedAt" TEXT,
        "completedBy" TEXT,
        recurring BOOLEAN DEFAULT FALSE,
        "recurrenceInterval" INTEGER,
        "nextOccurrence" TEXT,
        "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch {}
}

// GET - Fetch patient tasks - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const assignedBy = searchParams.get('assignedBy')

    await ensureTable(pool)

    // PRIMARY: Direct pg
    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramCount = 1

      if (patientId) {
        conditions.push(`"patientId" = $${paramCount}`)
        params.push(patientId)
        paramCount++
      }
      if (status) {
        conditions.push(`status = $${paramCount}`)
        params.push(status)
        paramCount++
      }
      if (assignedBy) {
        conditions.push(`"assignedBy" = $${paramCount}`)
        params.push(assignedBy)
        paramCount++
      }

      const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'
      const result = await pool.query(`
        SELECT * FROM patient_tasks WHERE ${whereClause} ORDER BY "scheduledTime" ASC LIMIT 200
      `, params)

      await pool.end()
      return NextResponse.json({ success: true, tasks: result.rows, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      let whereClause = '1=1'
      if (patientId) whereClause += ` AND "patientId" = '${patientId}'`
      if (status) whereClause += ` AND status = '${status}'`
      if (assignedBy) whereClause += ` AND "assignedBy" = '${assignedBy}'`
      
      const tasks = await p.$queryRawUnsafe(`SELECT * FROM patient_tasks WHERE ${whereClause} ORDER BY "scheduledTime" ASC LIMIT 200`) || []
      await pool.end()
      return NextResponse.json({ success: true, tasks, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, tasks: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching patient tasks', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new patient task - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, patient, taskId, taskName, scheduledTime, duration, notes, priority, assignedBy, recurring, recurrenceInterval } = body

    await ensureTable(pool)

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        INSERT INTO patient_tasks (
          id, "patientId", patient, "taskId", "taskName", "scheduledTime",
          duration, notes, priority, "assignedBy", recurring, "recurrenceInterval", status, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13)
      `, [id, patientId, JSON.stringify(patient || {}), taskId, taskName, scheduledTime, duration, notes, priority || 'routine', assignedBy, recurring || false, recurrenceInterval, now])

      await pool.end()
      logger.info('Patient task created via direct pg', { id, taskName, patientId })

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
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        INSERT INTO patient_tasks (id, "patientId", patient, "taskId", "taskName", "scheduledTime",
          duration, notes, priority, "assignedBy", recurring, "recurrenceInterval", status, "createdAt")
        VALUES ('${id}', ${patientId ? `'${patientId}'` : 'NULL'}, ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
          ${taskId ? `'${taskId}'` : 'NULL'}, ${taskName ? `'${taskName.replace(/'/g, "''")}'` : 'NULL'},
          ${scheduledTime ? `'${scheduledTime}'` : 'NULL'}, ${duration || 'NULL'},
          ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, ${priority ? `'${priority}'` : "'routine'"},
          ${assignedBy ? `'${assignedBy}'` : 'NULL'}, ${recurring ? 'TRUE' : 'FALSE'}, ${recurrenceInterval || 'NULL'}, 'pending', '${now}')
      `)
      await pool.end()
      return NextResponse.json({ success: true, task: { id, ...body, status: 'pending', createdAt: now }, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error creating patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update patient task status - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { id, status, startedAt, completedAt, completedBy, notes } = body

    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // PRIMARY: Direct pg
    try {
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
          `, [newId, nextTime.toISOString(), now, id])
          
          logger.info('Created next recurring task', { newId, scheduledTime: nextTime.toISOString() })
        }
      }

      await pool.end()
      logger.info('Patient task updated via direct pg', { id, status })
      return NextResponse.json({ success: true, message: 'Task updated successfully', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg PUT failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`
        UPDATE patient_tasks SET status = ${status ? `'${status}'` : 'status'},
          "startedAt" = ${startedAt ? `'${startedAt}'` : status === 'in_progress' ? `'${now}'` : '"startedAt"'},
          "completedAt" = ${completedAt ? `'${completedAt}'` : status === 'completed' ? `'${now}'` : '"completedAt"'},
          "completedBy" = ${completedBy ? `'${completedBy}'` : '"completedBy"'},
          notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'}
        WHERE id = '${id}'
      `)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Task updated successfully', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error updating patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete patient task - BULLETPROOF
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    // PRIMARY: Direct pg
    try {
      await pool.query(`DELETE FROM patient_tasks WHERE id = $1`, [id])
      await pool.end()
      logger.info('Patient task deleted via direct pg', { id })
      return NextResponse.json({ success: true, message: 'Task deleted', method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg DELETE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      await p.$executeRawUnsafe(`DELETE FROM patient_tasks WHERE id = '${id}'`)
      await pool.end()
      return NextResponse.json({ success: true, message: 'Task deleted', method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error deleting patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
