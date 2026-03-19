// Emergency Alert API - Prisma/SQLite Implementation
import { NextRequest } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Emergency')

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

    // Try to save to database via Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        await p.emergencyAlerts.create({
          data: alert
        })
        logger.info('Emergency alert saved to database', { alertId: alert.id, type, location })
      }
    } catch (dbError: any) {
      logger.warn('Database save failed, using memory fallback', { error: dbError.message })
      // FALLBACK: In-memory storage
      memoryAlerts.unshift(alert)
      if (memoryAlerts.length > 50) memoryAlerts = memoryAlerts.slice(0, 50)
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
    
    // Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        
        const where: any = {}
        if (status !== 'all') where.status = status
        
        const alerts = await p.emergencyAlerts.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: 100
        })
        
        const activeCount = alerts.filter((a: any) => a.status === 'active').length
        
        return successResponse({
          alerts,
          totalActive: activeCount,
          source: 'database'
        })
      }
    } catch (prismaError: any) {
      logger.warn('Prisma GET failed', { error: prismaError.message })
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

    // Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        
        const updatedAlert = await p.emergencyAlerts.update({
          where: { id: alertId },
          data: { status }
        })
        
        logger.info('Alert status updated', { alertId, newStatus: status })
        
        return successResponse({
          alert: updatedAlert,
          message: `Alert status updated to ${status}`
        })
      }
    } catch (prismaError: any) {
      logger.warn('Prisma PUT failed', { error: prismaError.message })
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
    
    // Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        await p.emergencyAlerts.delete({
          where: { id: alertId }
        })
        logger.info('Alert deleted', { alertId })
        return successResponse({ message: 'Alert deleted successfully' })
      }
    } catch (prismaError: any) {
      logger.warn('Prisma DELETE failed', { error: prismaError.message })
    }
    
    // FALLBACK: Memory
    memoryAlerts = memoryAlerts.filter(a => a.id !== alertId)
    return successResponse({ message: 'Alert deleted from memory' })
  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'delete' })
  }
}
