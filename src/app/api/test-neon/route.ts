import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  
  // Safe logging - hide password
  let safeUrl = dbUrl
  if (dbUrl.includes('@')) {
    const parts = dbUrl.split('@')
    if (parts.length === 2) {
      safeUrl = `${parts[0].split(':').slice(0, 2).join(':')}:***@${parts[1]}`
    }
  }
  
  const logs: string[] = []
  
  try {
    logs.push('Starting Prisma client creation...')
    
    // Dynamic imports
    logs.push('Importing @neondatabase/serverless...')
    const { neonConfig } = await import('@neondatabase/serverless')
    logs.push('Importing @prisma/adapter-neon...')
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    logs.push('Importing @/generated/prisma...')
    const { PrismaClient } = await import('@/generated/prisma')
    logs.push('All imports successful')
    
    if (!dbUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'DATABASE_URL not set',
        logs
      })
    }
    
    // Setup WebSocket for Neon
    logs.push('Setting up WebSocket...')
    if (typeof window === 'undefined') {
      try {
        const ws = await import('ws')
        neonConfig.webSocketConstructor = ws.default || ws
        logs.push('WebSocket configured')
      } catch (wsError: any) {
        logs.push(`WebSocket setup failed: ${wsError.message}`)
      }
    }
    
    // Create adapter with connection string
    logs.push('Creating PrismaNeon adapter with connection string...')
    const adapter = new PrismaNeon({ connectionString: dbUrl })
    logs.push('Adapter created')
    
    // Create Prisma client
    logs.push('Creating PrismaClient...')
    const client = new PrismaClient({ adapter })
    logs.push('PrismaClient created')
    
    // Test query
    logs.push('Testing Prisma query...')
    const testResult = await client.$queryRaw`SELECT 1 as test`
    logs.push(`Prisma query result: ${JSON.stringify(testResult)}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prisma works!',
      safeUrl,
      logs
    })
  } catch (error: any) {
    logs.push(`Error: ${error.message}`)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      safeUrl,
      logs
    })
  }
}
