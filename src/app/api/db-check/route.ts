import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: DATABASE_URL exists?
  results.checks.databaseUrlSet = !!process.env.DATABASE_URL
  results.checks.databaseUrlPreview = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.substring(0, 50) + '...' 
    : 'NOT SET'

  // Check 2: DIRECT_DATABASE_URL exists?
  results.checks.directDatabaseUrlSet = !!process.env.DIRECT_DATABASE_URL

  // Check 3: Try to connect
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })
    
    const client = await pool.connect()
    const res = await client.query('SELECT COUNT(*) as count FROM users')
    client.release()
    await pool.end()
    
    results.checks.connection = 'SUCCESS'
    results.checks.userCount = res.rows[0].count
  } catch (error: any) {
    results.checks.connection = 'FAILED'
    results.checks.connectionError = error.message
  }

  // Check 4: Environment
  results.checks.nodeEnv = process.env.NODE_ENV
  results.checks.vercelEnv = process.env.VERCEL_ENV || 'not on vercel'

  return NextResponse.json(results, { status: 200 })
}
