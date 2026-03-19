// Real-time Broadcasting API - Handles SSE and real-time updates
// SECURITY: POST requires authentication (ADMIN, SUPER_ADMIN, DOCTOR, NURSE only)
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'

// Store connected clients globally
declare global {
  var realtimeClients: Map<string, Set<ReadableStreamDefaultController>> | undefined
  var lastDeploymentVersion: string | undefined
}

// Allowed roles for broadcasting
const ALLOWED_BROADCAST_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']

// Current server version - update this on deployments
const SERVER_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || new Date().toISOString().split('T')[0]

function getClients(): Map<string, Set<ReadableStreamDefaultController>> {
  if (!global.realtimeClients) {
    global.realtimeClients = new Map()
  }
  return global.realtimeClients
}

// Broadcast message to all connected clients
function broadcastToAll(event: string, data: any, version?: string) {
  const clients = getClients()
  const message = `data: ${JSON.stringify({ 
    event, 
    data, 
    timestamp: Date.now(),
    version: version || SERVER_VERSION
  })}\n\n`
  
  let totalClients = 0
  clients.forEach((clientSet, _channel) => {
    clientSet.forEach(client => {
      try {
        client.enqueue(message)
        totalClients++
      } catch (e) {
        clientSet.delete(client)
      }
    })
  })
  
  return totalClients
}

// Broadcast to specific channel
function broadcastToChannel(channel: string, event: string, data: any, version?: string) {
  const clients = getClients()
  const channelClients = clients.get(channel)
  
  if (!channelClients) return 0
  
  const message = `data: ${JSON.stringify({ 
    event, 
    data, 
    timestamp: Date.now(),
    version: version || SERVER_VERSION
  })}\n\n`
  
  let notified = 0
  channelClients.forEach(client => {
    try {
      client.enqueue(message)
      notified++
    } catch (e) {
      channelClients.delete(client)
    }
  })
  
  return notified
}

// GET - SSE endpoint for real-time updates (Public - clients subscribe to receive updates)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channel = searchParams.get('channel') || 'default'
  
  const clients = getClients()
  
  const stream = new ReadableStream({
    start(controller) {
      // Add client to channel
      if (!clients.has(channel)) {
        clients.set(channel, new Set())
      }
      clients.get(channel)!.add(controller)
      
      // Send initial connection message with version
      controller.enqueue(`data: ${JSON.stringify({ 
        event: 'connected', 
        channel,
        message: 'Connected to real-time updates',
        timestamp: Date.now(),
        version: SERVER_VERSION
      })}\n\n`)
      
      // Immediately send version check
      controller.enqueue(`data: ${JSON.stringify({ 
        event: 'version_check', 
        version: SERVER_VERSION,
        timestamp: Date.now()
      })}\n\n`)
      
      // Keep-alive heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ 
            event: 'heartbeat', 
            timestamp: Date.now(),
            version: SERVER_VERSION
          })}\n\n`)
        } catch (e) {
          clearInterval(heartbeat)
          clients.get(channel)?.delete(controller)
        }
      }, 15000)
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.get(channel)?.delete(controller)
        console.log(`Client disconnected from channel: ${channel}`)
      })
      
      console.log(`Client connected to channel: ${channel}`)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

// POST - Broadcast message to all clients
// SECURITY: Requires authentication with allowed roles
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate the request
  const auth = await authenticateRequest(request)
  
  if (!auth.authenticated) {
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication required to broadcast messages' 
    }, { status: 401 })
  }

  // SECURITY: Check if user has allowed role
  if (!auth.user || !ALLOWED_BROADCAST_ROLES.includes(auth.user.role)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Insufficient privileges. Only staff can broadcast.' 
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { event, data, channel, version } = body
    
    if (!event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event type is required' 
      }, { status: 400 })
    }

    // Special handling for deployment refresh
    if (event === 'deployment_refresh') {
      const clients = getClients()
      let totalClients = 0
      
      clients.forEach((clientSet) => {
        clientSet.forEach(client => {
          try {
            client.enqueue(`data: ${JSON.stringify({ 
              event: 'deployment_refresh',
              timestamp: Date.now(),
              version: SERVER_VERSION,
              message: 'New deployment detected, please refresh'
            })}\n\n`)
            totalClients++
          } catch (e) {
            clientSet.delete(client)
          }
        })
      })
      
      return NextResponse.json({ 
        success: true, 
        clientsNotified: totalClients,
        broadcastBy: auth.user.email,
        role: auth.user.role
      })
    }

    let clientsNotified = 0
    
    if (channel) {
      // Broadcast to specific channel
      clientsNotified = broadcastToChannel(channel, event, data, version)
    } else {
      // Broadcast to all
      clientsNotified = broadcastToAll(event, data, version)
    }
    
    return NextResponse.json({ 
      success: true, 
      clientsNotified,
      broadcastBy: auth.user.email,
      role: auth.user.role,
      serverVersion: SERVER_VERSION
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to broadcast',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Trigger a deployment refresh notification to all clients
export async function DELETE(request: NextRequest) {
  // This endpoint can be called by deployment scripts to notify all clients
  const auth = await authenticateRequest(request)
  
  if (!auth.authenticated || (auth.user?.role !== 'SUPER_ADMIN' && auth.user?.role !== 'ADMIN')) {
    return NextResponse.json({ 
      success: false, 
      error: 'Only admins can trigger deployment refresh' 
    }, { status: 403 })
  }
  
  const clientsNotified = broadcastToAll('deployment_refresh', {
    message: 'New deployment detected',
    timestamp: Date.now()
  }, SERVER_VERSION)
  
  return NextResponse.json({ 
    success: true, 
    clientsNotified,
    message: 'Deployment refresh notification sent to all clients'
  })
}
