import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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
      return NextResponse.json({ 
        success: false, 
        error: 'Emergency type and location are required' 
      }, { status: 400 })
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

    // Send SMS notifications if requested
    if (sendSMS) {
      try {
        const zai = await ZAI.create()
        
        // Emergency contacts for the health centre
        const emergencyContacts = [
          process.env.EMERGENCY_PHONE_1,
          process.env.EMERGENCY_PHONE_2,
        ].filter(Boolean)

        if (emergencyContacts.length > 0) {
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
            console.log('Emergency SMS sent successfully')
          }
        }
      } catch (smsError) {
        console.error('Failed to send emergency SMS:', smsError)
      }
    }

    return NextResponse.json({
      success: true,
      alert,
      message: 'Emergency alert created successfully',
      responseInstructions: getResponseInstructions(type)
    })

  } catch (error) {
    console.error('Emergency alert error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create emergency alert'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  let alerts = activeAlerts
  if (status) {
    alerts = alerts.filter(a => a.status === status)
  }
  
  return NextResponse.json({
    success: true,
    alerts,
    totalActive: activeAlerts.filter(a => a.status === 'active').length
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, status } = body

    if (!alertId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alert ID and status are required' 
      }, { status: 400 })
    }

    const alertIndex = activeAlerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alert not found' 
      }, { status: 404 })
    }

    activeAlerts[alertIndex].status = status as 'active' | 'responding' | 'resolved'

    return NextResponse.json({
      success: true,
      alert: activeAlerts[alertIndex],
      message: `Alert status updated to ${status}`
    })

  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update alert status'
    }, { status: 500 })
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
