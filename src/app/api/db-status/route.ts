// Database Status API - Debug database connection
import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  
  // Safe details (no password exposed)
  const details = {
    hasDatabaseUrl: !!dbUrl,
    host: dbUrl ? dbUrl.match(/@([^:]+):/)?.[1] : null,
    port: dbUrl ? dbUrl.match(/:(\d+)\//)?.[1] : null,
    database: dbUrl ? dbUrl.match(/\/([^?]+)$/)?.[1] : null,
    nodeEnv: process.env.NODE_ENV,
    nextPhase: process.env.NEXT_PHASE || 'not set',
    timestamp: new Date().toISOString(),
  }

  try {
    const { testConnection } = await import('@/lib/db')
    const result = await testConnection()
    
    return NextResponse.json({
      status: result.success ? '✅ CONNECTED' : '❌ DISCONNECTED',
      message: result.message,
      details: {
        ...details,
        ...result.details,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ ERROR',
      message: error.message,
      details,
    })
  }
}
