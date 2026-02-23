// Prisma Client for PostgreSQL (Supabase) - Prisma 7.x Compatible
// Works on Vercel serverless with proper connection pooling

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

// Global type for Prisma singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create Prisma client with proper error handling
function createPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('[DB] ❌ DATABASE_URL not configured')
    return null
  }

  // Validate URL format
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('[DB] ❌ Invalid DATABASE_URL format. Must start with postgresql://')
    return null
  }

  try {
    console.log('[DB] 🔄 Creating Prisma client...')
    
    // Extract host for logging (hide credentials)
    const hostMatch = dbUrl.match(/@([^:]+):/)
    const host = hostMatch ? hostMatch[1] : 'unknown'
    console.log('[DB] 📍 Connecting to host:', host)

    // Create connection pool with optimized settings for serverless
    const pool = new Pool({
      connectionString: dbUrl,
      max: 1, // Single connection for serverless
      idleTimeoutMillis: 10000, // 10 seconds
      connectionTimeoutMillis: 10000, // 10 seconds timeout
      ssl: { 
        rejectUnauthorized: false // Required for Supabase
      },
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[DB] ⚠️ Pool error:', err.message)
    })

    // Create Prisma client with pg adapter
    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ 
      adapter,
      log: [
        { level: 'error', emit: 'console' },
      ]
    })

    // Store pool for cleanup
    globalForPrisma.pool = pool

    console.log('[DB] ✅ Prisma client created successfully')
    return client

  } catch (error) {
    console.error('[DB] ❌ Failed to create Prisma client:', error)
    return null
  }
}

// Get Prisma client with singleton pattern
export const getPrisma = (): PrismaClient | null => {
  // Return cached instance if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Don't create during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[DB] 🔨 Build phase - skipping Prisma client creation')
    return null
  }

  // Create new instance
  const client = createPrismaClient()
  
  if (client) {
    globalForPrisma.prisma = client
  }
  
  return client
}

// Test database connection with detailed feedback
export async function testConnection(): Promise<{ 
  success: boolean
  message: string
  details?: {
    host?: string
    database?: string
    error?: string
  }
}> {
  const dbUrl = process.env.DATABASE_URL

  // Check if URL exists
  if (!dbUrl) {
    return { 
      success: false, 
      message: 'DATABASE_URL environment variable is not set',
      details: { error: 'Missing environment variable' }
    }
  }

  // Validate URL format
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    return { 
      success: false, 
      message: 'Invalid DATABASE_URL format',
      details: { error: 'URL must start with postgresql:// or postgres://' }
    }
  }

  // Extract info from URL
  const hostMatch = dbUrl.match(/@([^:]+):/)
  const dbMatch = dbUrl.match(/\/([^?]+)/)
  const host = hostMatch ? hostMatch[1] : 'unknown'
  const database = dbMatch ? dbMatch[1] : 'unknown'

  const prisma = getPrisma()
  
  if (!prisma) {
    return { 
      success: false, 
      message: 'Failed to create Prisma client',
      details: { host, database }
    }
  }
  
  try {
    // Execute test query
    await (prisma as any).$queryRaw`SELECT 1 as test`
    
    console.log('[DB] ✅ Connection test successful')
    return { 
      success: true, 
      message: 'Database connected successfully',
      details: { host, database }
    }
  } catch (error: any) {
    console.error('[DB] ❌ Connection test failed:', error.message)
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      details: { host, database, error: error.message }
    }
  }
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  try {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect()
      globalForPrisma.prisma = undefined
      console.log('[DB] 🔌 Prisma client disconnected')
    }
    if (globalForPrisma.pool) {
      await globalForPrisma.pool.end()
      globalForPrisma.pool = undefined
      console.log('[DB] 🔌 Connection pool closed')
    }
  } catch (error) {
    console.error('[DB] ⚠️ Error during disconnect:', error)
  }
}

// Export - don't initialize at module load time
let _prisma: PrismaClient | null = null
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) {
      _prisma = getPrisma()
    }
    if (_prisma) {
      return (_prisma as any)[prop]
    }
    return undefined
  }
})

export default prisma
