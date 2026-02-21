// Database Configuration for Prisma 7 + PostgreSQL (Serverless)
// Using direct URL with connection pooling

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
    initError = 'DATABASE_URL environment variable is not set'
    return null
  }

  try {
    // For Prisma 7, we can pass datasourceUrl directly
    // This bypasses the adapter requirement
    const client = new PrismaClient({
      datasourceUrl: dbUrl,
      log: ['error']
    })
    
    initError = null
    return client
    
  } catch (err: any) {
    initError = `Failed to create PrismaClient: ${err.message}`
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
    return { 
      success: false, 
      message: 'Database client not initialized', 
      error: initError 
    }
  }
  
  try {
    await (prisma as any).$queryRaw`SELECT 1 as test`
    return { success: true, message: 'Database connected successfully!' }
  } catch (err: any) {
    return { 
      success: false, 
      message: 'Database connection failed', 
      error: err.message 
    }
  }
}

export const prisma = getPrisma()
export default prisma
