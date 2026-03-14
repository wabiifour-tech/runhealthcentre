// Real-time Broadcasting API - Handles SSE and real-time updates
import { NextRequest } from 'next/server'

// Store connected clients globally
declare global {
  var realtimeClients: Map<string, Set<ReadableStreamDefaultController>> | undefined
}

function getClients(): Map<string, Set<ReadableStreamDefaultController>> {
  if (!global.realtimeClients) {
    global.realtimeClients = new Map()
  }
  return global.realtimeClients
}

// Broadcast message to all connected clients
function broadcastToAll(event: string, data: any) {
  const clients = getClients()
  const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`
  
  clients.forEach((clientSet, _channel) => {
    clientSet.forEach(client => {
      try {
        client.enqueue(message)
      } catch (e) {
        clientSet.delete(client)
      }
    })
  })
}

// GET - SSE endpoint for real-time updates
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
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ 
        event: 'connected', 
        channel,
        message: 'Connected to real-time updates',
        timestamp: Date.now() 
      })}\n\n`)
      
      // Keep-alive heartbeat every 10 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ event: 'heartbeat', timestamp: Date.now() })}\n\n`)
        } catch (e) {
          clearInterval(heartbeat)
          clients.get(channel)?.delete(controller)
        }
      }, 10000)
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.get(channel)?.delete(controller)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// POST - Broadcast message to all clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data, channel } = body
    
    if (channel) {
      // Broadcast to specific channel
      const clients = getClients()
      const channelClients = clients.get(channel)
      if (channelClients) {
        const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`
        channelClients.forEach(client => {
          try {
            client.enqueue(message)
          } catch (e) {
            channelClients.delete(client)
          }
        })
      }
    } else {
      // Broadcast to all
      broadcastToAll(event, data)
    }
    
    const clients = getClients()
    let totalClients = 0
    clients.forEach(c => totalClients += c.size)
    
    return Response.json({ 
      success: true, 
      clientsNotified: totalClients 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: 'Failed to broadcast' 
    }, { status: 500 })
  }
}
