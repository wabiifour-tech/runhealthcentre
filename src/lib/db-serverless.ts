// Database Configuration for Redeemer's University Health Centre (RUHC) HMS
// PostgreSQL (Neon) Serverless Configuration
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion

import { getPool as getSingletonPool, getPrisma, query as dbQuery } from './db'
import { createLogger } from './logger'

const logger = createLogger('DBServerless')

// Re-export the singleton pool getter
export const getPool = getSingletonPool

/**
 * Execute a query with automatic connection handling
 * Uses singleton pool from /lib/db.ts
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPool()
  
  try {
    const result = await pool.query(sql, params)
    return result.rows as T[]
  } catch (error: any) {
    logger.error('Query failed', { sql: sql.substring(0, 100), error: error.message })
    throw error
  }
}

/**
 * Execute a query and return single row
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Execute an INSERT, UPDATE, or DELETE
 */
export async function execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
  const pool = getPool()
  
  try {
    const result = await pool.query(sql, params)
    return { rowCount: result.rowCount || 0 }
  } catch (error: any) {
    logger.error('Execute failed', { sql: sql.substring(0, 100), error: error.message })
    throw error
  }
}

/**
 * Insert a record and return it
 */
export async function insertOne<T = any>(table: string, data: Record<string, any>): Promise<T> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
  const columnNames = columns.map(c => `"${c}"`).join(', ')
  
  const sql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) RETURNING *`
  const result = await queryOne<T>(sql, values)
  
  if (!result) {
    throw new Error('Insert failed - no result returned')
  }
  
  return result
}

/**
 * Update records and return them
 */
export async function updateMany<T = any>(
  table: string, 
  data: Record<string, any>, 
  where: Record<string, any>
): Promise<T[]> {
  const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
  const setValues = Object.values(data)
  
  const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${setValues.length + i + 1}`).join(' AND ')
  const whereValues = Object.values(where)
  
  const allValues = [...setValues, ...whereValues]
  const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses} RETURNING *`
  
  return await query<T>(sql, allValues)
}

/**
 * Check database availability
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await query('SELECT 1')
    return true
  } catch {
    return false
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  connected: boolean
  users: number
  patients: number
  consultations: number
}> {
  try {
    const [users, patients, consultations] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM patients'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM consultations')
    ])
    
    return {
      connected: true,
      users: parseInt(users?.count || '0'),
      patients: parseInt(patients?.count || '0'),
      consultations: parseInt(consultations?.count || '0')
    }
  } catch (error) {
    return {
      connected: false,
      users: 0,
      patients: 0,
      consultations: 0
    }
  }
}

// Export prisma getter for compatibility
export { getPrisma }
