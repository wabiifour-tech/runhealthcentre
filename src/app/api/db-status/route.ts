// Database Status API - Debug database connection
import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_DATABASE_URL: !!process.env.DIRECT_DATABASE_URL,
    TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    LIBSQL_URL: !!process.env.LIBSQL_URL,
    NEXT_PHASE: process.env.NEXT_PHASE || 'not set',
    NODE_ENV: process.env.NODE_ENV,
  }

  // Get URL host for debugging (without exposing credentials)
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
  const urlHost = dbUrl ? dbUrl.match(/@([^:]+):/)?.[1] || 'unknown' : 'not configured'

  try {
    const { testConnection } = await import('@/lib/db')
    const connectionTest = await testConnection()
    
    return NextResponse.json({
      status: connectionTest.success ? 'connected' : 'disconnected',
      message: connectionTest.message,
      environment: envStatus,
      databaseHost: urlHost,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      environment: envStatus,
      databaseHost: urlHost,
      timestamp: new Date().toISOString()
    })
  }
}
