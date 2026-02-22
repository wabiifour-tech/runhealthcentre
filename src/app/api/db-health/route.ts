// Database Health Check API
// Returns detailed database connection status
import { NextResponse } from 'next/server'
import { testConnection, getPrisma } from '@/lib/db'

export async function GET() {
  const startTime = Date.now()
  
  // Check environment variables
  const hasDbUrl = !!process.env.DATABASE_URL
  const hasDirectUrl = !!process.env.DIRECT_DATABASE_URL
  
  // Mask the URL for security (show only host)
  let dbHost = 'not configured'
  if (process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/@([^:]+):/)
    dbHost = match ? match[1] : 'unknown'
  }
  
  // Test connection
  const connectionTest = await testConnection()
  
  // Try to get Prisma client
  const prisma = getPrisma()
  const hasPrismaClient = !!prisma
  
  // Response time
  const responseTime = Date.now() - startTime
  
  // Determine overall status
  const isHealthy = connectionTest.success && hasPrismaClient
  
  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    
    // Environment check
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'not on vercel',
      hasDatabaseUrl: hasDbUrl,
      hasDirectUrl: hasDirectUrl,
      dbHost: dbHost,
    },
    
    // Connection status
    connection: {
      success: connectionTest.success,
      message: connectionTest.message,
      details: connectionTest.details,
    },
    
    // Prisma status
    prisma: {
      clientReady: hasPrismaClient,
    },
    
    // Troubleshooting help
    troubleshooting: !isHealthy ? [
      '1. Check if DATABASE_URL is set in Vercel Environment Variables',
      '2. Verify the database URL format: postgresql://user:pass@host:port/database',
      '3. Ensure the database allows connections from Vercel IPs',
      '4. Check if SSL is required and properly configured',
      '5. Verify the database exists and tables are created',
    ] : null,
  }, { 
    status: isHealthy ? 200 : 503 
  })
}
