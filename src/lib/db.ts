// Prisma Client for PostgreSQL (Neon) - Prisma 7.x Compatible
// Works on Vercel serverless with Neon serverless driver

import { Pool } from 'pg'

// Global type for Prisma singleton
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Create Prisma client with Neon serverless driver
async function createPrismaClient(): Promise<any | null> {
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
    console.log('[DB] 🔄 Creating Prisma client with Neon adapter...')
    
    // Dynamic imports for serverless compatibility
    const { neonConfig } = await import('@neondatabase/serverless')
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    const { PrismaClient } = await import('@/generated/prisma')
    
    // Setup WebSocket for Neon (required for serverless)
    // Only import ws in Node.js environment
    if (typeof window === 'undefined') {
      try {
        const ws = await import('ws')
        neonConfig.webSocketConstructor = ws.default || ws
        console.log('[DB] ✅ WebSocket configured for Neon')
      } catch (wsError) {
        console.log('[DB] ⚠️ ws package not available, using HTTP')
      }
    }
    
    // Extract host for logging (hide credentials)
    const hostMatch = dbUrl.match(/@([^:/]+)/)
    const host = hostMatch ? hostMatch[1] : 'unknown'
    console.log('[DB] 📍 Connecting to host:', host)

    // Create Prisma client with Neon adapter using connection string
    const adapter = new PrismaNeon({ connectionString: dbUrl })
    const client = new PrismaClient({ adapter })

    console.log('[DB] ✅ Prisma client created successfully')
    return client

  } catch (error) {
    console.error('[DB] ❌ Failed to create Prisma client:', error)
    return null
  }
}

// Get Prisma client with singleton pattern
export const getPrisma = async (): Promise<any | null> => {
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
  const client = await createPrismaClient()
  
  if (client) {
    globalForPrisma.prisma = client
  }
  
  return client
}

// Create a direct pg Pool for raw queries (fallback)
let pool: Pool | null = null

export const getPool = (): Pool => {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      pool = new Pool({
        connectionString: dbUrl,
        max: 1,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      })
    }
  }
  return pool!
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
  const hostMatch = dbUrl.match(/@([^:/]+)/)
  const dbMatch = dbUrl.match(/\/([^?]+)/)
  const host = hostMatch ? hostMatch[1] : 'unknown'
  const database = dbMatch ? dbMatch[1] : 'unknown'

  // Try direct pg connection first (more reliable)
  try {
    const pool = getPool()
    const client = await pool.connect()
    await client.query('SELECT 1 as test')
    client.release()
    
    console.log('[DB] ✅ Direct connection test successful')
    return { 
      success: true, 
      message: 'Database connected successfully',
      details: { host, database }
    }
  } catch (error: any) {
    console.error('[DB] ❌ Direct connection test failed:', error.message)
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      details: { host, database, error: error.message }
    }
  }
}

// Execute a query using direct pg connection (fallback for when Prisma fails)
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result.rows
}

// Execute a single insert and return the inserted row
export async function insertOne(table: string, data: Record<string, any>): Promise<any> {
  const pool = getPool()
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const columns = keys.join(', ')
  
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
  const result = await pool.query(sql, values)
  return result.rows[0]
}

// Find one row by condition
export async function findOne(table: string, condition: Record<string, any>): Promise<any | null> {
  const pool = getPool()
  const keys = Object.keys(condition)
  const values = Object.values(condition)
  const whereClause = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
  
  const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`
  const result = await pool.query(sql, values)
  return result.rows[0] || null
}

// Update one row by ID
export async function updateOne(table: string, id: string, data: Record<string, any>): Promise<any | null> {
  const pool = getPool()
  const keys = Object.keys(data)
  const values = Object.values(data)
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`
  const result = await pool.query(sql, [...values, id])
  return result.rows[0] || null
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  try {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect()
      globalForPrisma.prisma = undefined
      console.log('[DB] 🔌 Prisma client disconnected')
    }
    if (pool) {
      await pool.end()
      pool = null
      console.log('[DB] 🔌 Pool disconnected')
    }
  } catch (error) {
    console.error('[DB] ⚠️ Error during disconnect:', error)
  }
}

// Export a function to get prisma client
let _prisma: any = null
export const prisma = {
  get client() {
    return async () => {
      if (!_prisma) {
        _prisma = await getPrisma()
      }
      return _prisma
    }
  }
}

export default prisma
