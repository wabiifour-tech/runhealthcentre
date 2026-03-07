import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  // Use DATABASE_URL (Neon) first, not DIRECT_DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectDbUrl: !!process.env.DIRECT_DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  }

  if (!dbUrl) {
    result.error = 'No database URL configured'
    return NextResponse.json(result)
  }

  result.urlPattern = dbUrl.substring(0, 40) + '...'

  // Test raw pg connection
  const pool = new Pool({
    connectionString: dbUrl,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const client = await pool.connect()
    const res = await client.query('SELECT NOW() as now, current_database() as db')
    result.success = true
    result.database = res.rows[0].db
    result.serverTime = res.rows[0].now
    client.release()
    
    // Try to query users table
    try {
      const usersRes = await pool.query('SELECT COUNT(*) as count FROM users')
      result.usersCount = parseInt(usersRes.rows[0].count)
    } catch (tableErr: any) {
      result.usersTableError = tableErr.message
    }
    
    // Try to query app_settings table
    try {
      const settingsRes = await pool.query('SELECT * FROM app_settings WHERE id = $1', ['default'])
      result.settingsFound = settingsRes.rows.length > 0
      if (settingsRes.rows.length > 0) {
        result.settings = settingsRes.rows[0]
      }
    } catch (settingsErr: any) {
      result.settingsTableError = settingsErr.message
    }
    
  } catch (err: any) {
    result.error = err.message
    result.errorCode = err.code
  } finally {
    await pool.end()
  }

  return NextResponse.json(result)
}
