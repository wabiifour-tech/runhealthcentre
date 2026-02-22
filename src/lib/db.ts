// Prisma Client Singleton for RUN Health Centre HMS
// Using Supabase PostgreSQL with Prisma 7.x - Optimized for Serverless

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton instance
let prismaInstance: PrismaClient | null = null

export const getPrisma = (): PrismaClient | null => {
  // Return cached instance if available
  if (prismaInstance) return prismaInstance
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
    return prismaInstance
  }
  
  // Don't create during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }

  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL configured')
    return null
  }

  console.log('[DB] Creating Prisma client...')
  console.log('[DB] Host:', dbUrl.match(/@([^:]+):/)?.[1] || 'unknown')

  try {
    const pool = new Pool({
      connectionString: dbUrl,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    })

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message)
    })

    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ 
      adapter,
      log: ['error']
    })
    
    prismaInstance = client
    globalForPrisma.prisma = client
    
    console.log('[DB] Prisma client created successfully')
    return client
  } catch (error) {
    console.error('[DB] Failed to create Prisma client:', error)
    return null
  }
}

// Test database connection
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const prisma = getPrisma()
  
  if (!prisma) {
    return { success: false, message: 'Database client not initialized - check DATABASE_URL' }
  }
  
  try {
    await (prisma as any).$queryRaw`SELECT 1`
    return { success: true, message: 'Database connected successfully' }
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` }
  }
}

export const prisma = getPrisma()
export default prisma
