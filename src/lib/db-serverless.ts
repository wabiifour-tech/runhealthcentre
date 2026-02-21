// Database Configuration for RUN Health Centre HMS
// Supports multiple database backends for serverless compatibility

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database client singleton
let prismaInstance: PrismaClient | null = null

// Check if we're in build phase
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build' || 
         process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL
}

// Create PrismaClient for PostgreSQL (Supabase) with proper serverless config
function createPrismaClient(): PrismaClient | null {
  if (isBuildPhase()) {
    console.log('[DB] Build phase - skipping database connection')
    return null
  }

  // Get database URLs
  // DATABASE_URL should be the pooler connection (port 6543) for serverless
  // DIRECT_DATABASE_URL should be the direct connection (port 5432) for migrations
  const poolerUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_DATABASE_URL
  
  // Prefer pooler URL for serverless runtime, fallback to direct
  const dbUrl = poolerUrl || directUrl

  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL configured, running in demo mode')
    return null
  }

  console.log('[DB] Creating Prisma client...')
  console.log('[DB] Connection type:', poolerUrl ? 'pooler (serverless)' : 'direct')

  try {
    // Create PostgreSQL connection pool with serverless-optimized settings
    const poolConfig: any = {
      connectionString: dbUrl,
      max: 1, // Single connection for serverless
      idleTimeoutMillis: 10000, // 10 seconds idle timeout
      connectionTimeoutMillis: 10000, // 10 seconds connection timeout
      allowExitOnIdle: true, // Allow process to exit when pool is idle
    }

    // Add SSL for Supabase (required)
    if (dbUrl.includes('supabase') || dbUrl.includes('pooler')) {
      poolConfig.ssl = { 
        rejectUnauthorized: false 
      }
    }

    const pool = new Pool(poolConfig)

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message)
    })

    // Create PostgreSQL adapter for Prisma 7.x
    const adapter = new PrismaPg(pool)

    // Create PrismaClient with adapter
    const client = new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['error', 'warn'] 
        : ['error']
    })
    
    console.log('[DB] Prisma client created successfully')
    return client
  } catch (error) {
    console.error('[DB] Failed to create Prisma client:', error)
    return null
  }
}

// Export singleton getter
export const getPrisma = (): PrismaClient | null => {
  if (!prismaInstance) {
    prismaInstance = globalForPrisma.prisma ?? createPrismaClient()
    if (prismaInstance) {
      globalForPrisma.prisma = prismaInstance
    }
  }
  return prismaInstance
}

// Async database availability check
export async function isDatabaseAvailable(): Promise<boolean> {
  const prisma = getPrisma()
  if (!prisma) return false
  
  try {
    await (prisma as any).user.count()
    return true
  } catch {
    return false
  }
}

// Export
export const prisma = getPrisma()
export default prisma
