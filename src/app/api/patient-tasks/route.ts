// Patient Tasks API - For nursing interventions and patient care tasks
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PatientTasksAPI')

// GET - Fetch patient tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const assignedBy = searchParams.get('assignedBy')
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, tasks: [], mode: 'demo' })
    }

    const p = prisma as any
    
    let conditions = []
    if (patientId) conditions.push(`"patientId" = '${patientId}'`)
    if (status) conditions.push(`status = '${status}'`)
    if (assignedBy) conditions.push(`"assignedBy" = '${assignedBy}'`)
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'

    const tasks = await p.$queryRawUnsafe(`
      SELECT * FROM patient_tasks 
      WHERE ${whereClause}
      ORDER BY "scheduledTime" ASC
      LIMIT 200
    `)

    return NextResponse.json({ success: true, tasks: tasks || [] })
  } catch (error: any) {
    logger.error('Error fetching patient tasks', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new patient task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      patientId, patient, taskId, taskName, scheduledTime,
      duration, notes, priority, assignedBy, recurring, recurrenceInterval
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      INSERT INTO patient_tasks (
        id, "patientId", patient, "taskId", "taskName", "scheduledTime",
        duration, notes, priority, "assignedBy", recurring, "recurrenceInterval",
        status, "createdAt"
      ) VALUES (
        '${id}',
        ${patientId ? `'${patientId}'` : 'NULL'},
        ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
        ${taskId ? `'${taskId}'` : 'NULL'},
        ${taskName ? `'${taskName.replace(/'/g, "''")}'` : 'NULL'},
        ${scheduledTime ? `'${scheduledTime}'` : 'NULL'},
        ${duration || 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        ${priority ? `'${priority}'` : "'routine'"},
        ${assignedBy ? `'${assignedBy}'` : 'NULL'},
        ${recurring ? 'TRUE' : 'FALSE'},
        ${recurrenceInterval || 'NULL'},
        'pending',
        '${now}'
      )
    `)

    logger.info('Patient task created', { id, taskName, patientId })

    // Create notification for assigned staff
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'patient_task',
          title: 'New Task Assigned',
          message: `Task "${taskName}" assigned for patient ${patient?.name || ''}`,
          targetRoles: ['NURSE'],
          priority: priority || 'normal',
          data: { taskId: id, patientId, taskName }
        })
      })
    } catch {}

    return NextResponse.json({ 
      success: true, 
      task: { id, ...body, status: 'pending', createdAt: now } 
    })
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

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      UPDATE patient_tasks 
      SET 
        status = ${status ? `'${status}'` : 'status'},
        "startedAt" = ${startedAt ? `'${startedAt}'` : status === 'in_progress' ? `'${now}'` : '"startedAt"'},
        "completedAt" = ${completedAt ? `'${completedAt}'` : status === 'completed' ? `'${now}'` : '"completedAt"'},
        "completedBy" = ${completedBy ? `'${completedBy}'` : status === 'completed' ? `'${completedBy}'` : '"completedBy"'},
        notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'}
      WHERE id = '${id}'
    `)

    logger.info('Patient task updated', { id, status })

    // If recurring, create next occurrence
    if (status === 'completed') {
      try {
        const task = await p.$queryRawUnsafe(`
          SELECT * FROM patient_tasks WHERE id = '${id}'
        `)
        if (task[0]?.recurring && task[0]?.recurrenceInterval) {
          const nextTime = new Date(task[0].scheduledTime)
          nextTime.setMinutes(nextTime.getMinutes() + task[0].recurrenceInterval)
          
          const newId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await p.$executeRawUnsafe(`
            INSERT INTO patient_tasks (
              id, "patientId", patient, "taskId", "taskName", "scheduledTime",
              duration, notes, priority, "assignedBy", recurring, "recurrenceInterval",
              status, "createdAt"
            ) SELECT 
              '${newId}', "patientId", patient, "taskId", "taskName", '${nextTime.toISOString()}',
              duration, notes, priority, "assignedBy", recurring, "recurrenceInterval",
              'pending', '${now}'
            FROM patient_tasks WHERE id = '${id}'
          `)
          logger.info('Created next recurring task', { newId, scheduledTime: nextTime.toISOString() })
        }
      } catch (e: any) {
        logger.warn('Failed to create next recurring task', { error: e.message })
      }
    }

    return NextResponse.json({ success: true, message: 'Task updated successfully' })
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

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any

    await p.$executeRawUnsafe(`
      DELETE FROM patient_tasks WHERE id = '${id}'
    `)

    logger.info('Patient task deleted', { id })

    return NextResponse.json({ success: true, message: 'Task deleted' })
  } catch (error: any) {
    logger.error('Error deleting patient task', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
