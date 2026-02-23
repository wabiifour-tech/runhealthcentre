import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if we can import the modules
    const { Pool } = await import('@neondatabase/serverless')
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const { PrismaClient } = await import('../../generated/prisma/client')
    
    const dbUrl = process.env.DATABASE_URL || ''
    
    if (!dbUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'DATABASE_URL not set' 
      })
    }
    
    // Create pool
    const pool = new Pool({ connectionString: dbUrl })
    
    // Test direct query
    const result = await pool.query('SELECT 1 as test')
    
    // Close pool
    await pool.end()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Direct Neon connection works!',
      result: result.rows,
      prismaClient: typeof PrismaClient,
      adapter: typeof PrismaNeon
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    })
  }
}
