// Debug endpoint to test signup
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(request: NextRequest) {
  const debug: Record<string, any> = { steps: [] }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const body = await request.json()
    debug.input = body

    // Step 1: Test connection
    debug.steps.push({ step: 'connecting', timestamp: new Date().toISOString() })
    const client = await pool.connect()
    debug.steps.push({ step: 'connected', success: true })
    
    // Step 2: Test query
    const testResult = await client.query('SELECT NOW() as now')
    debug.steps.push({ step: 'test_query', success: true, time: testResult.rows[0].now })
    
    // Step 3: Check if users table exists
    const tableCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' LIMIT 5
    `)
    debug.steps.push({ step: 'check_table', columns: tableCheck.rows.map(r => r.column_name) })
    
    // Step 4: Try to insert
    if (body.testInsert) {
      const userId = `test_${Date.now()}`
      debug.steps.push({ step: 'inserting', userId })
      
      try {
        await client.query(`
          INSERT INTO users (
            id, email, name, "firstName", "lastName", password, role, 
            department, initials, phone, "isActive", "isFirstLogin", 
            "approvalStatus", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          userId,
          `test${Date.now()}@ruhc`,
          'Test User',
          'Test',
          'User',
          'hashedpassword123',
          'NURSE',
          null,
          'TU',
          null,
          true,
          false,
          'PENDING',
          new Date()
        ])
        debug.steps.push({ step: 'insert', success: true })
        
        // Clean up
        await client.query('DELETE FROM users WHERE id = $1', [userId])
        debug.steps.push({ step: 'cleanup', success: true })
      } catch (insertError: any) {
        debug.steps.push({ 
          step: 'insert', 
          success: false, 
          error: insertError.message,
          code: insertError.code,
          detail: insertError.detail
        })
      }
    }
    
    client.release()
    
    return NextResponse.json({ success: true, debug })
    
  } catch (error: any) {
    debug.error = error.message
    debug.errorCode = error.code
    return NextResponse.json({ success: false, debug })
  } finally {
    await pool.end()
  }
}
