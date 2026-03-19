// Debug environment endpoint - DISABLED IN PRODUCTION
import { NextResponse } from 'next/server'

export async function GET() {
  // SECURITY: Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Not available in production',
      message: 'Debug endpoints are disabled in production mode'
    }, { status: 403 })
  }

  const dbUrl = process.env.DATABASE_URL || ''
  
  // Safe logging - hide password
  let safeUrl = dbUrl
  if (dbUrl.includes('@')) {
    const parts = dbUrl.split('@')
    if (parts.length === 2) {
      const credentials = parts[0].split(':')
      if (credentials.length >= 3) {
        safeUrl = `${credentials[0]}:***@${parts[1]}`
      }
    }
  }
  
  return NextResponse.json({
    hasDbUrl: !!dbUrl,
    dbUrlLength: dbUrl.length,
    dbUrlStart: dbUrl.substring(0, 30),
    dbUrlEnd: dbUrl.substring(dbUrl.length - 50),
    safeUrl,
    containsNeon: dbUrl.includes('neon.tech'),
    containsSupabase: dbUrl.includes('supabase'),
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')).sort()
  })
}
