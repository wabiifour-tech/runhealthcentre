// Database Configuration for RUN Health Centre HMS
// PostgreSQL with Prisma 7.x - Optimized for Serverless

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | null = null
let lastError: string | null = null

function createPrismaClient(): PrismaClient | null {
  // Don't create during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[DB] Build phase - skipping')
    return null
  }

  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL')
    lastError = 'No DATABASE_URL configured'
    return null
  }

  console.log('[DB] Creating Prisma client...')

  try {
    // Create connection pool
    const pool = new Pool({
      connectionString: dbUrl,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: false }
    })

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message)
    })

    // Create Prisma adapter
    const adapter = new PrismaPg(pool)
    
    // Create Prisma client
    const client = new PrismaClient({ 
      adapter,
      log: ['error']
    })
    
    console.log('[DB] Prisma client created OK')
    lastError = null
    return client
    
  } catch (error: any) {
    console.error('[DB] Create error:', error.message)
    lastError = error.message
    return null
  }
}

export const getPrisma = (): PrismaClient | null => {
  if (!prismaInstance) {
    prismaInstance = globalForPrisma.prisma ?? createPrismaClient()
    if (prismaInstance) {
      globalForPrisma.prisma = prismaInstance
    }
  }
  return prismaInstance
}

export function getLastError(): string | null {
  return lastError
}

export async function testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  const dbUrl = process.env.DATABASE_URL
  
  const details = {
    hasUrl: !!dbUrl,
    host: dbUrl ? dbUrl.split('@')[1]?.split(':')[0] : null,
    port: dbUrl ? dbUrl.match(/:(\d+)\//)?.[1] : null,
    nodeEnv: process.env.NODE_ENV,
    lastError: lastError,
  }
  
  const prisma = getPrisma()
  
  if (!prisma) {
    return { 
      success: false, 
      message: lastError || 'Database client not initialized', 
      details 
    }
  }
  
  try {
    await (prisma as any).$queryRaw`SELECT 1 as test`
    return { success: true, message: 'Database connected successfully', details }
  } catch (error: any) {
    return { success: false, message: error.message, details }
  }
}

export const prisma = getPrisma()
export default prisma
