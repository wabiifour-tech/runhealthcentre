import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Emergency')

interface EmergencyAlert {
  id: string
  type: 'medical' | 'security' | 'fire' | 'other'
  location: string
  description: string
  reporterName?: string
  reporterPhone?: string
  timestamp: string
  status: 'active' | 'responding' | 'resolved'
}

// In-memory storage for alerts (in production, use a database)
let activeAlerts: EmergencyAlert[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, location, description, reporterName, reporterPhone, sendSMS } = body

    if (!type || !location) {
      throw Errors.validation('Emergency type and location are required')
    }

    // Create emergency alert
    const alert: EmergencyAlert = {
      id: `EMG-${Date.now()}`,
      type,
      location,
      description: description || 'Emergency reported',
      reporterName,
      reporterPhone,
      timestamp: new Date().toISOString(),
      status: 'active'
    }

    // Add to active alerts
    activeAlerts.unshift(alert)
    if (activeAlerts.length > 50) activeAlerts = activeAlerts.slice(0, 50)

    logger.info('Emergency alert created', { 
      alertId: alert.id, 
      type, 
      location 
    })

    // Send SMS notifications if requested
    if (sendSMS) {
      try {
        // Emergency contacts for the health centre
        const emergencyContacts = [
          process.env.EMERGENCY_PHONE_1,
          process.env.EMERGENCY_PHONE_2,
        ].filter(Boolean)

        if (emergencyContacts.length > 0 && process.env.TERMII_API_KEY) {
          const emergencyMessage = `🚨 EMERGENCY ALERT\nType: ${type.toUpperCase()}\nLocation: ${location}\nDescription: ${description || 'Emergency reported'}\nTime: ${new Date().toLocaleString()}\nReporter: ${reporterName || 'Anonymous'}\n\nPlease respond immediately.`
          
          // Send SMS via Termii
          const response = await fetch('https://api.ng.termii.com/api/sms/send', {
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

          if (response.ok) {
            logger.info('Emergency SMS sent', { alertId: alert.id })
          }
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  let alerts = activeAlerts
  if (status) {
    alerts = alerts.filter(a => a.status === status)
  }
  
  return successResponse({
    alerts,
    totalActive: activeAlerts.filter(a => a.status === 'active').length
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, status } = body

    if (!alertId || !status) {
      throw Errors.validation('Alert ID and status are required')
    }

    const alertIndex = activeAlerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      throw Errors.notFound('Alert')
    }

    activeAlerts[alertIndex].status = status as 'active' | 'responding' | 'resolved'

    logger.info('Alert status updated', { alertId, newStatus: status })

    return successResponse({
      alert: activeAlerts[alertIndex],
      message: `Alert status updated to ${status}`
    })

  } catch (error) {
    return errorResponse(error, { module: 'Emergency', operation: 'update' })
  }
}

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
