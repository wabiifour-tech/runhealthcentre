// Emergency Alert API - BULLETPROOF Database Operations
// Direct pg (PRIMARY) → Prisma (SECONDARY) → Graceful Fallback
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Emergency')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// Ensure emergency_alerts table exists
async function ensureTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      "reporterName" TEXT,
      "reporterPhone" TEXT,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {})
}

// In-memory fallback for when database is completely unavailable
let memoryAlerts: any[] = []

function getResponseInstructions(type: string): string[] {
  switch (type) {
    case 'medical':
      return [
        'Stay calm and assess the situation',
        'If trained, provide first aid',
        'Call for medical assistance: Health Centre Extension',
        'Do not move the patient unless necessary',
        'Clear the area for emergency responders'
      ]
    case 'security':
      return [
        'Move to a safe location immediately',
        'Do not confront any threat',
        'Call security: Campus Security Line',
        'Alert others in the vicinity',
        'Wait for security personnel'
      ]
    case 'fire':
      return [
        'Evacuate the area immediately',
        'Do not use elevators',
        'Close doors behind you',
        'Call fire services: 112 or 199',
        'Assemble at designated points'
      ]
    default:
      return [
        'Stay calm',
        'Assess the situation',
        'Contact appropriate emergency services',
        'Follow instructions from emergency personnel'
      ]
  }
}

// POST - Create emergency alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, location, description, reporterName, reporterPhone, sendSMS } = body

    if (!type || !location) {
      throw Errors.validation('Emergency type and location are required')
    }

    // Create emergency alert object
    const alert = {
      id: `EMG-${Date.now()}`,
      type,
      location,
      description: description || 'Emergency reported',
      reporterName: reporterName || null,
      reporterPhone: reporterPhone || null,
      timestamp: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    }

    // PRIMARY: Direct pg
    const pool = getPool()
    try {
      await ensureTable(pool)
      await pool.query(`
        INSERT INTO emergency_alerts (id, type, location, description, "reporterName", "reporterPhone", timestamp, status, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [alert.id, alert.type, alert.location, alert.description, alert.reporterName, alert.reporterPhone, alert.timestamp, alert.status, alert.createdAt])
      
      await pool.end()
      logger.info('Emergency alert saved to database', { alertId: alert.id, type, location })
    } catch (pgError: any) {
      await pool.end().catch(() => {})
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
      
      // SECONDARY: Prisma
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          await p.$executeRawUnsafe(`
            INSERT INTO emergency_alerts (id, type, location, description, "reporterName", "reporterPhone", timestamp, status, "createdAt")
            VALUES ('${alert.id}', '${alert.type}', '${alert.location.replace(/'/g, "''")}', '${alert.description.replace(/'/g, "''")}', ${alert.reporterName ? `'${alert.reporterName.replace(/'/g, "''")}'` : 'NULL'}, ${alert.reporterPhone ? `'${alert.reporterPhone}'` : 'NULL'}, '${alert.timestamp}', '${alert.status}', '${alert.createdAt}')
          `)
          logger.info('Emergency alert saved via Prisma', { alertId: alert.id })
        }
      } catch (prismaError: any) {
        logger.error('Prisma also failed, using memory fallback', { error: prismaError.message })
        // FALLBACK: In-memory storage
        memoryAlerts.unshift(alert)
        if (memoryAlerts.length > 50) memoryAlerts = memoryAlerts.slice(0, 50)
      }
    }

    // Send SMS notifications if requested
    if (sendSMS) {
      try {
        const emergencyContacts = [
          process.env.EMERGENCY_PHONE_1,
          process.env.EMERGENCY_PHONE_2,
        ].filter(Boolean)

        if (emergencyContacts.length > 0 && process.env.TERMII_API_KEY) {
          const emergencyMessage = `🚨 EMERGENCY ALERT\nType: ${type.toUpperCase()}\nLocation: ${location}\nDescription: ${description || 'Emergency reported'}\nTime: ${new Date().toLocaleString()}\nReporter: ${reporterName || 'Anonymous'}\n\nPlease respond immediately.`
          
          await fetch('https://api.ng.termii.com/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: emergencyContacts[0],
              from: 'RUN-HC',
              sms: emergencyMessage,
              type: 'plain',
              channel: 'generic',
              api_key: process.env.TERMII_API_KEY
            })
          })
          logger.info('Emergency SMS sent', { alertId: alert.id })
        }
      } catch (smsError) {
        logger.error('Failed to send emergency SMS', { error: String(smsError) })
      }
    }

    return successResponse({
      alert,
      message: 'Emergency alert created successfully',
      responseInstructions: getResponseInstructions(type)
    })

  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'create' })
  }
}

// GET - Fetch emergency alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    
    // PRIMARY: Direct pg
    const pool = getPool()
    try {
      await ensureTable(pool)
      
      let query = `SELECT * FROM emergency_alerts ORDER BY timestamp DESC LIMIT 100`
      const params: any[] = []
      
      if (status !== 'all') {
        query = `SELECT * FROM emergency_alerts WHERE status = $1 ORDER BY timestamp DESC LIMIT 100`
        params.push(status)
      }
      
      const result = await pool.query(query, params)
      const alerts = result.rows
      
      // Count active alerts
      const activeCount = alerts.filter((a: any) => a.status === 'active').length
      
      await pool.end()
      
      return successResponse({
        alerts,
        totalActive: activeCount,
        source: 'database'
      })
    } catch (pgError: any) {
      await pool.end().catch(() => {})
      logger.warn('Direct pg GET failed, trying Prisma', { error: pgError.message })
      
      // SECONDARY: Prisma
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          const alerts = await p.$queryRawUnsafe(`
            SELECT * FROM emergency_alerts ORDER BY timestamp DESC LIMIT 100
          `)
          
          const activeCount = (alerts as any[]).filter((a: any) => a.status === 'active').length
          
          return successResponse({
            alerts,
            totalActive: activeCount,
            source: 'prisma'
          })
        }
      } catch (prismaError: any) {
        logger.warn('Prisma GET also failed', { error: prismaError.message })
      }
      
      // FALLBACK: Return memory alerts
      let filtered = memoryAlerts
      if (status !== 'all') {
        filtered = memoryAlerts.filter(a => a.status === status)
      }
      
      return successResponse({
        alerts: filtered,
        totalActive: memoryAlerts.filter(a => a.status === 'active').length,
        source: 'memory-fallback',
        warning: 'Database unavailable, using temporary storage'
      })
    }
  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'get' })
  }
}

// PUT - Update alert status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, status } = body

    if (!alertId || !status) {
      throw Errors.validation('Alert ID and status are required')
    }

    // Validate status
    const validStatuses = ['active', 'responding', 'resolved']
    if (!validStatuses.includes(status)) {
      throw Errors.validation('Invalid status. Must be: active, responding, or resolved')
    }

    // PRIMARY: Direct pg
    const pool = getPool()
    try {
      await ensureTable(pool)
      
      const result = await pool.query(`
        UPDATE emergency_alerts SET status = $1 WHERE id = $2
      `, [status, alertId])
      
      if (result.rowCount === 0) {
        await pool.end()
        throw Errors.notFound('Alert')
      }
      
      // Fetch updated alert
      const updatedResult = await pool.query(`SELECT * FROM emergency_alerts WHERE id = $1`, [alertId])
      const updatedAlert = updatedResult.rows[0]
      
      await pool.end()
      logger.info('Alert status updated', { alertId, newStatus: status })
      
      return successResponse({
        alert: updatedAlert,
        message: `Alert status updated to ${status}`
      })
    } catch (pgError: any) {
      await pool.end().catch(() => {})
      
      if (pgError.name === 'ApiError') throw pgError
      
      logger.warn('Direct pg PUT failed, trying Prisma', { error: pgError.message })
      
      // SECONDARY: Prisma
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          await p.$executeRawUnsafe(`
            UPDATE emergency_alerts SET status = '${status}' WHERE id = '${alertId}'
          `)
          
          const alerts = await p.$queryRawUnsafe(`SELECT * FROM emergency_alerts WHERE id = '${alertId}'`)
          
          if (!alerts || (alerts as any[]).length === 0) {
            throw Errors.notFound('Alert')
          }
          
          return successResponse({
            alert: (alerts as any[])[0],
            message: `Alert status updated to ${status}`
          })
        }
      } catch (prismaError: any) {
        logger.warn('Prisma PUT also failed', { error: prismaError.message })
      }
      
      // FALLBACK: Update memory alerts
      const alertIndex = memoryAlerts.findIndex(a => a.id === alertId)
      if (alertIndex === -1) {
        throw Errors.notFound('Alert')
      }
      
      memoryAlerts[alertIndex].status = status
      
      return successResponse({
        alert: memoryAlerts[alertIndex],
        message: `Alert status updated to ${status}`,
        warning: 'Database unavailable, updated in memory only'
      })
    }
  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'update' })
  }
}

// DELETE - Delete an alert (for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')
    
    if (!alertId) {
      throw Errors.validation('Alert ID is required')
    }
    
    // PRIMARY: Direct pg
    const pool = getPool()
    try {
      await pool.query(`DELETE FROM emergency_alerts WHERE id = $1`, [alertId])
      await pool.end()
      
      logger.info('Alert deleted', { alertId })
      return successResponse({ message: 'Alert deleted successfully' })
    } catch (pgError: any) {
      await pool.end().catch(() => {})
      
      // SECONDARY: Prisma
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          await p.$executeRawUnsafe(`DELETE FROM emergency_alerts WHERE id = '${alertId}'`)
          return successResponse({ message: 'Alert deleted successfully' })
        }
      } catch (prismaError: any) {
        logger.warn('Prisma DELETE failed', { error: prismaError.message })
      }
      
      // FALLBACK: Memory
      memoryAlerts = memoryAlerts.filter(a => a.id !== alertId)
      return successResponse({ message: 'Alert deleted from memory' })
    }
  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'delete' })
  }
}
