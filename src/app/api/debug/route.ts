import { NextResponse } from 'next/server'

export async function GET() {
  const debug: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectDbUrl: !!process.env.DIRECT_DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE,
    }
  }

  try {
    const dbModule = await import('@/lib/db')
    const prisma = dbModule.default
    
    debug.prismaCreated = !!prisma
    
    if (prisma) {
      try {
        const p = prisma as any
        
        // Try to query the database
        const userCount = await p.users.count()
        debug.userCount = userCount
        debug.mode = 'database'
        debug.message = 'Database connected successfully!'
        
      } catch (queryError: any) {
        debug.queryError = queryError.message
        debug.mode = 'demo'
        debug.message = 'Database query failed'
      }
    } else {
      debug.mode = 'demo'
      debug.message = 'Prisma client is null'
    }
  } catch (importError: any) {
    debug.importError = importError.message
    debug.mode = 'demo'
    debug.message = 'Failed to import db module'
  }

  return NextResponse.json(debug)
}
