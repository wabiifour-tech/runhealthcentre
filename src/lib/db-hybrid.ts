/**
 * Hybrid Database Configuration
 * Works with both SQLite (local) and PostgreSQL (production/Neon)
 */

import { Pool } from 'pg'
import { createLogger } from './logger'

const logger = createLogger('HybridDB')

// Detect database type from DATABASE_URL
function getDatabaseType(): 'sqlite' | 'postgresql' {
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('file:') || dbUrl.endsWith('.db')) {
    return 'sqlite'
  }
  return 'postgresql'
}

const DB_TYPE = getDatabaseType()
logger.info(`Database type detected: ${DB_TYPE}`)

// PostgreSQL pool singleton
let pgPool: Pool | null = null

// SQLite database path
const SQLITE_PATH = process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db'

/**
 * Get PostgreSQL pool (for production)
 */
export function getPostgresPool(): Pool {
  if (!pgPool) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl || dbUrl.startsWith('file:')) {
      throw new Error('PostgreSQL DATABASE_URL not configured')
    }
    
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
    
    pgPool.on('error', (err) => {
      logger.error('PostgreSQL pool error', { error: err.message })
    })
    
    logger.info('PostgreSQL pool created')
  }
  
  return pgPool
}

/**
 * Execute a query - works for both SQLite and PostgreSQL
 */
export async function executeQuery(sql: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
  if (DB_TYPE === 'postgresql') {
    const pool = getPostgresPool()
    const result = await pool.query(sql, params)
    return { rows: result.rows, rowCount: result.rowCount || 0 }
  } else {
    // For SQLite, we'll use a simple approach
    // In production with Vercel, this won't be used
    throw new Error('SQLite queries should be handled by Prisma in development')
  }
}

/**
 * Check if we're using PostgreSQL
 */
export function isPostgreSQL(): boolean {
  return DB_TYPE === 'postgresql'
}

/**
 * Check if we're using SQLite
 */
export function isSQLite(): boolean {
  return DB_TYPE === 'sqlite'
}

/**
 * Get database type
 */
export function getDbType(): 'sqlite' | 'postgresql' {
  return DB_TYPE
}

export default {
  getPostgresPool,
  executeQuery,
  isPostgreSQL,
  isSQLite,
  getDbType
}
