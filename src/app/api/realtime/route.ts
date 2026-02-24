import { NextRequest } from 'next/server'

// Store connected clients globally (persists across requests in development)
declare global {
  var realtimeClients: Set<ReadableStreamDefaultController> | undefined
}

// Get or initialize clients set
function getClients(): Set<ReadableStreamDefaultController> {
  if (!global.realtimeClients) {
    global.realtimeClients = new Set<ReadableStreamDefaultController>()
  }
  return global.realtimeClients
}

// Broadcast message to all connected clients
export function broadcastToClients(event: string, data: any) {
  const clients = getClients()
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  clients.forEach(client => {
    try {
      client.enqueue(message)
    } catch (e) {
      clients.delete(client)
    }
  })
}

// SSE endpoint for real-time updates
export async function GET(request: NextRequest) {
  const clients = getClients()
  
  const stream = new ReadableStream({
    start(controller) {
      // Add client to connected clients
      clients.add(controller)
      
      // Send initial connection message
      controller.enqueue(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to real-time updates', time: Date.now() })}\n\n`)
      
      // Keep-alive heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`)
        } catch (e) {
          clearInterval(heartbeat)
          clients.delete(controller)
        }
      }, 15000)
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(controller)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// POST endpoint to broadcast messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body
    
    broadcastToClients(event, data)
    
    const clients = getClients()
    return Response.json({ success: true, clientsNotified: clients.size })
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to broadcast' }, { status: 500 })
  }
}
