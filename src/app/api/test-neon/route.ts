import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  
  // Safe logging - hide password
  let safeUrl = dbUrl
  if (dbUrl.includes('@')) {
    const parts = dbUrl.split('@')
    if (parts.length === 2) {
      safeUrl = `${parts[0].split(':').slice(0, 2).join(':')}:***@${parts[1]}`
    }
  }
  
  const logs: string[] = []
  
  try {
    logs.push('Starting Prisma client creation...')
    
    // Dynamic imports
    logs.push('Importing @neondatabase/serverless...')
    const { Pool } = await import('@neondatabase/serverless')
    logs.push('Importing @prisma/adapter-neon...')
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    logs.push('Importing @/generated/prisma...')
    const { PrismaClient } = await import('@/generated/prisma')
    logs.push('All imports successful')
    
    if (!dbUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'DATABASE_URL not set',
        logs
      })
    }
    
    // Create pool
    logs.push('Creating Neon pool...')
    const pool = new Pool({ connectionString: dbUrl })
    
    // Test direct query first
    logs.push('Testing direct query...')
    const result = await pool.query('SELECT 1 as test')
    logs.push(`Direct query result: ${JSON.stringify(result.rows)}`)
    
    // Create adapter
    logs.push('Creating PrismaNeon adapter...')
    const adapter = new PrismaNeon(pool)
    logs.push('Adapter created')
    
    // Create Prisma client
    logs.push('Creating PrismaClient...')
    const client = new PrismaClient({ adapter })
    logs.push('PrismaClient created')
    
    // Test query
    logs.push('Testing Prisma query...')
    const testResult = await client.$queryRaw`SELECT 1 as test`
    logs.push(`Prisma query result: ${JSON.stringify(testResult)}`)
    
    // Close pool
    await pool.end()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prisma works!',
      safeUrl,
      logs
    })
  } catch (error: any) {
    logs.push(`Error: ${error.message}`)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      safeUrl,
      logs
    })
  }
}
