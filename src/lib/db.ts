// Database Configuration - Prisma 7 with PostgreSQL for Serverless
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let initError: string | null = null

function createPrismaClient(): PrismaClient | null {
  // Skip during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }

  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    initError = 'DATABASE_URL not set'
    return null
  }

  try {
    // Create PostgreSQL pool
    const pool = new Pool({
      connectionString: dbUrl,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    })

    // Create Prisma adapter for pg
    const adapter = new PrismaPg(pool)

    // Create Prisma client with adapter
    const client = new PrismaClient({ adapter })
    
    initError = null
    return client
    
  } catch (err: any) {
    initError = err.message || 'Unknown error'
    return null
  }
}

export function getPrisma(): PrismaClient | null {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient() ?? undefined
  }
  return globalForPrisma.prisma ?? null
}

export function getInitError(): string | null {
  return initError
}

export async function testConnection(): Promise<{ success: boolean; message: string; error?: string | null }> {
  const prisma = getPrisma()
  
  if (!prisma) {
    return { success: false, message: 'Client not initialized', error: initError }
  }
  
  try {
    await (prisma as any).$queryRaw`SELECT 1`
    return { success: true, message: 'Connected successfully' }
  } catch (err: any) {
    return { success: false, message: 'Connection failed', error: err.message }
  }
}

export const prisma = getPrisma()
export default prisma
