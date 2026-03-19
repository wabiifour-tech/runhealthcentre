// PostgreSQL Database Configuration for RUHC HMS
// Direct connection to Neon PostgreSQL

import { Pool } from 'pg'
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Database client singleton
let prismaInstance: PrismaClient | null = null
let poolInstance: Pool | null = null

// Check if we're in build phase
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

// Get PostgreSQL Pool connection
export function getPool(): Pool {
  if (poolInstance) return poolInstance
  
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL not configured')
  }
  
  poolInstance = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  })
  
  poolInstance.on('error', (err) => {
    console.error('[DB] Pool error:', err.message)
  })
  
  return poolInstance
}

// Create PrismaClient for PostgreSQL (Neon) - direct connection
function createPrismaClient(): PrismaClient | null {
  if (isBuildPhase()) {
    console.log('[DB] Build phase - skipping database connection')
    return null
  }

  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL configured, running in demo mode')
    return null
  }

  console.log('[DB] Creating Prisma client for Neon PostgreSQL (direct)...')

  try {
    // Create PrismaClient with direct connection (no adapter)
    // The URL is set via environment variable which Prisma reads automatically
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    })
    
    console.log('[DB] ✅ Prisma client created successfully')
    return client
  } catch (error) {
    console.error('[DB] ❌ Failed to create Prisma client:', error)
    return null
  }
}

// Get Prisma client with singleton pattern
export const getPrisma = async (): Promise<PrismaClient | null> => {
  // Return cached instance if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Don't create during build phase
  if (isBuildPhase()) {
    console.log('[DB] 🔨 Build phase - skipping Prisma client creation')
    return null
  }

  // Create new instance
  if (!prismaInstance) {
    prismaInstance = createPrismaClient()
    if (prismaInstance) {
      globalForPrisma.prisma = prismaInstance
    }
  }
  
  return prismaInstance
}

// Test database connection with detailed feedback
export async function testConnection(): Promise<{ 
  success: boolean
  message: string
  details?: {
    path?: string
    error?: string
  }
}> {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    return { 
      success: false, 
      message: 'DATABASE_URL environment variable is not set',
      details: { error: 'Missing environment variable' }
    }
  }

  try {
    const pool = getPool()
    const testResult = await pool.query('SELECT 1 as test')
    
    console.log('[DB] ✅ Connection test successful')
    return { 
      success: true, 
      message: 'Database connected successfully (PostgreSQL/Neon)',
      details: { path: dbUrl.substring(0, 50) + '...' }
    }
  } catch (error: any) {
    console.error('[DB] ❌ Connection test failed:', error.message)
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      details: { path: dbUrl.substring(0, 50) + '...', error: error.message }
    }
  }
}

// Execute a query (for raw SQL needs)
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const pool = getPool()
  const queryResult = await pool.query(sql, params)
  return queryResult.rows
}

// Execute a single insert and return the inserted row
export async function insertOne(table: string, data: Record<string, any>): Promise<any> {
  const pool = getPool()
  const columns = Object.keys(data).map(k => `"${k}"`).join(', ')
  const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
  const values = Object.values(data)
  const insertResult = await pool.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`, values)
  return insertResult.rows[0]
}

// Find one row by condition
export async function findOne(table: string, condition: Record<string, any>): Promise<any | null> {
  const pool = getPool()
  const clauses = Object.keys(condition).map((k, i) => `"${k}" = $${i + 1}`).join(' AND ')
  const values = Object.values(condition)
  const findResult = await pool.query(`SELECT * FROM ${table} WHERE ${clauses} LIMIT 1`, values)
  return findResult.rows[0] || null
}

// Update one row by ID
export async function updateOne(table: string, id: string, data: Record<string, any>): Promise<any | null> {
  const pool = getPool()
  const setClauses = Object.keys(data).map((k, i) => `"${k}" = $${i + 1}`).join(', ')
  const values = [...Object.values(data), id]
  const updateResult = await pool.query(`UPDATE ${table} SET ${setClauses} WHERE id = $${values.length} RETURNING *`, values)
  return updateResult.rows[0] || null
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  try {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect()
      globalForPrisma.prisma = undefined
      prismaInstance = null
      console.log('[DB] 🔌 Prisma client disconnected')
    }
    if (poolInstance) {
      await poolInstance.end()
      poolInstance = null
      console.log('[DB] 🔌 Pool disconnected')
    }
  } catch (error) {
    console.error('[DB] ⚠️ Error during disconnect:', error)
  }
}

// Async database availability check
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const pool = getPool()
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

// Export prisma getter
export const prisma = {
  get client() {
    return getPrisma()
  }
}

export default prisma
