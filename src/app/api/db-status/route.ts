// Database Status API - Debug database connection
import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  
  const details = {
    hasDatabaseUrl: !!dbUrl,
    host: dbUrl ? dbUrl.split('@')[1]?.split(':')[0] : null,
    port: dbUrl ? dbUrl.match(/:(\d+)\//)?.[1] : null,
    nodeEnv: process.env.NODE_ENV,
    nextPhase: process.env.NEXT_PHASE || 'not set',
  }

  try {
    const { testConnection, getLastError } = await import('@/lib/db')
    const result = await testConnection()
    const lastError = getLastError()
    
    return NextResponse.json({
      status: result.success ? '✅ CONNECTED' : '❌ DISCONNECTED',
      message: result.message,
      lastError: lastError,
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
