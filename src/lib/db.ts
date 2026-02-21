// Database Configuration for Prisma 5 + PostgreSQL (Serverless)
import { PrismaClient } from '@prisma/client'

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
    // Prisma 5 with Supabase connection pooling
    // Use minimal log level and configure for serverless
    const client = new PrismaClient({
      log: ['error'],
      // Important: configure for Supabase connection pooling
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    })
    
    initError = null
    return client
    
  } catch (err: any) {
    initError = `Failed to create PrismaClient: ${err.message}`
    return null
  }
}

// Singleton pattern for Prisma client in serverless environments
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
