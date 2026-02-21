// Database Status API
import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  
  const info = {
    hasDatabaseUrl: !!dbUrl,
    host: dbUrl ? dbUrl.split('@')[1]?.split(':')[0] : null,
    port: dbUrl ? dbUrl.match(/:(\d+)\//)?.[1] : null,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  }

  try {
    const { testConnection, getInitError } = await import('@/lib/db')
    const result = await testConnection()
    const initError = getInitError()
    
    return NextResponse.json({
      status: result.success ? '✅ CONNECTED' : '❌ FAILED',
      message: result.message,
      error: result.error || initError,
      info
    })
  } catch (err: any) {
    return NextResponse.json({
      status: '❌ ERROR',
      message: err.message,
      info
    })
  }
}
