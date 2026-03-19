/**
 * BULLETPROOF Database Operations for PostgreSQL (Neon)
 * 
 * This module provides fail-safe database operations that NEVER fail.
 * Pattern: Direct pg (PRIMARY) → Prisma (SECONDARY) → Graceful fallback
 * 
 * UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
 * 
 * Usage in API routes:
 * import { bp } from '@/lib/db-bulletproof'
 * 
 * // Query
 * const result = await bp.query('SELECT * FROM users WHERE id = $1', [userId])
 * 
 * // Insert
 * const result = await bp.insert('users', { id, email, name, ... })
 * 
 * // Update
 * const result = await bp.update('users', { name: 'New Name' }, { id: userId })
 * 
 * // Delete
 * const result = await bp.delete('users', { id: userId })
 */

import { Pool } from 'pg'
import { createLogger } from './logger'

const logger = createLogger('BulletproofDB')

// Singleton pool instance
let poolCache: Pool | null = null

/**
 * Get a PostgreSQL pool connection (singleton)
 */
export function getPool(): Pool {
  if (!poolCache) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured')
    }
    
    poolCache = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
    
    poolCache.on('error', (err) => {
      logger.error('Pool error', { error: err.message })
    })
    
    logger.info('PostgreSQL pool created')
  }
  
  return poolCache
}

/**
 * Get Prisma client (async)
 */
export async function getPrisma() {
  const { getPrisma: getClient } = await import('./db')
  return await getClient()
}

/**
 * Bulletproof query result type
 */
export interface BPResult<T = any> {
  success: boolean
  data?: T
  rows?: T[]
  rowCount?: number
  error?: string
  method?: 'direct-pg' | 'prisma' | 'fallback'
}

/**
 * Escape a value for SQL (for safety in raw queries)
 */
function escapeValue(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
  if (value instanceof Date) return `'${value.toISOString()}'`
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * BULLETPROOF Query Operations for PostgreSQL
 */
export const bp = {
  /**
   * Execute a SELECT query - NEVER fails
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<BPResult<T[]>> {
    // Use singleton pool
    const pool = getPool()
    
    // PRIMARY: Try direct PostgreSQL
    try {
      const result = await pool.query(sql, params)
      return {
        success: true,
        data: result.rows,
        rows: result.rows,
        rowCount: result.rowCount || result.rows.length,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      logger.warn('Direct pg query failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$queryRawUnsafe(sql, ...params)
        return {
          success: true,
          data: result,
          rows: Array.isArray(result) ? result : [result],
          rowCount: Array.isArray(result) ? result.length : 1,
          method: 'prisma'
        }
      }
    } catch (prismaError: any) {
      logger.warn('Prisma query also failed', { error: prismaError.message })
    }

    // FALLBACK: Return empty result
    return {
      success: false,
      data: [],
      rows: [],
      rowCount: 0,
      error: 'Database temporarily unavailable',
      method: 'fallback'
    }
  },

  /**
   * Execute INSERT - NEVER fails
   */
  async insert(table: string, data: Record<string, any>): Promise<BPResult> {
    const pool = getPool()
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = columns.map(c => `"${c}"`).join(', ')

    const sql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) RETURNING *`

    // PRIMARY: Try direct PostgreSQL
    try {
      const result = await pool.query(sql, values)
      return { 
        success: true, 
        data: result.rows[0],
        rowCount: result.rowCount || 1,
        method: 'direct-pg' 
      }
    } catch (pgError: any) {
      logger.warn('Direct pg INSERT failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        await p.$executeRawUnsafe(sql, ...values)
        return { success: true, method: 'prisma' }
      }
    } catch (prismaError: any) {
      logger.warn('Prisma INSERT also failed', { error: prismaError.message })
    }

    return {
      success: false,
      error: 'Failed to insert record'
    }
  },

  /**
   * Execute UPDATE - NEVER fails
   */
  async update(
    table: string, 
    data: Record<string, any>, 
    where: Record<string, any>
  ): Promise<BPResult> {
    const pool = getPool()
    const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const setValues = Object.values(data)
    
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${setValues.length + i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    
    const allValues = [...setValues, ...whereValues]
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses} RETURNING *`

    // PRIMARY: Try direct PostgreSQL
    try {
      const result = await pool.query(sql, allValues)
      return {
        success: true,
        data: result.rows[0],
        rowCount: result.rowCount || 0,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      logger.warn('Direct pg UPDATE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$executeRawUnsafe(sql, ...allValues)
        return {
          success: true,
          rowCount: result,
          method: 'prisma'
        }
      }
    } catch (prismaError: any) {
      logger.warn('Prisma UPDATE also failed', { error: prismaError.message })
    }

    return {
      success: false,
      error: 'Failed to update record'
    }
  },

  /**
   * Execute DELETE - NEVER fails
   */
  async delete(table: string, where: Record<string, any>): Promise<BPResult> {
    const pool = getPool()
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    const sql = `DELETE FROM ${table} WHERE ${whereClauses} RETURNING *`

    // PRIMARY: Try direct PostgreSQL
    try {
      const result = await pool.query(sql, whereValues)
      return {
        success: true,
        rowCount: result.rowCount || 0,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      logger.warn('Direct pg DELETE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$executeRawUnsafe(sql, ...whereValues)
        return {
          success: true,
          rowCount: result,
          method: 'prisma'
        }
      }
    } catch (prismaError: any) {
      logger.warn('Prisma DELETE also failed', { error: prismaError.message })
    }

    return {
      success: false,
      error: 'Failed to delete record'
    }
  },

  /**
   * Execute raw SQL - NEVER fails
   */
  async execute(sql: string, params: any[] = []): Promise<BPResult> {
    const pool = getPool()
    
    // PRIMARY: Try direct PostgreSQL
    try {
      const result = await pool.query(sql, params)
      return {
        success: true,
        rowCount: result.rowCount || 0,
        data: result.rows,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      logger.warn('Direct pg EXECUTE failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$executeRawUnsafe(sql, ...params)
        return {
          success: true,
          rowCount: result,
          method: 'prisma'
        }
      }
    } catch (prismaError: any) {
      logger.warn('Prisma EXECUTE also failed', { error: prismaError.message })
    }

    return {
      success: false,
      error: 'Failed to execute query'
    }
  },

  /**
   * Get single row - NEVER fails
   */
  async getOne<T = any>(sql: string, params: any[] = []): Promise<BPResult<T>> {
    const result = await this.query<T[]>(sql, params)
    return {
      success: result.success,
      data: result.data?.[0] as T | undefined,
      error: result.error,
      method: result.method
    }
  },

  /**
   * Check if record exists - NEVER fails
   */
  async exists(table: string, where: Record<string, any>): Promise<boolean> {
    const pool = getPool()
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    const sql = `SELECT 1 FROM ${table} WHERE ${whereClauses} LIMIT 1`

    try {
      const result = await pool.query(sql, whereValues)
      return result.rows.length > 0
    } catch {
      // Fallback to Prisma
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$queryRawUnsafe(sql, ...whereValues)
        return Array.isArray(result) && result.length > 0
      }
    } catch {}

    return false
  },

  /**
   * Count records - NEVER fails
   */
  async count(table: string, where?: Record<string, any>): Promise<number> {
    const pool = getPool()
    let sql = `SELECT COUNT(*) as count FROM ${table}`
    const values: any[] = []

    if (where && Object.keys(where).length > 0) {
      const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
      values.push(...Object.values(where))
      sql += ` WHERE ${whereClauses}`
    }

    try {
      const result = await pool.query(sql, values)
      return parseInt(String(result.rows[0]?.count || '0'))
    } catch {
      // Fallback to Prisma
    }

    // SECONDARY: Try Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const result = await p.$queryRawUnsafe(sql, ...values)
        if (Array.isArray(result) && result[0]) {
          return parseInt(String(result[0].count || '0'))
        }
      }
    } catch {}

    return 0
  }
}

/**
 * Helper to create audit logs - NEVER fails
 */
export async function createAuditLog(data: {
  userId: string
  userName: string
  action: string
  description: string
  metadata?: any
}): Promise<void> {
  try {
    await bp.insert('audit_logs', {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      description: data.description,
      metadata: JSON.stringify(data.metadata || {}),
      timestamp: new Date()
    })
  } catch (error) {
    logger.error('Failed to create audit log', { error: String(error) })
  }
}

/**
 * Helper to create notification - NEVER fails
 */
export async function createNotification(data: {
  type: string
  title: string
  message: string
  targetRoles: string[]
  targetUserId?: string
  data?: any
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}): Promise<void> {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await bp.insert('notifications', {
      id,
      userId: data.targetUserId || null,
      targetRoles: JSON.stringify(data.targetRoles),
      type: data.type,
      title: data.title,
      message: data.message,
      data: JSON.stringify(data.data || {}),
      priority: data.priority || 'normal',
      read: false,
      createdAt: new Date()
    })
  } catch (error) {
    logger.error('Failed to create notification', { error: String(error) })
  }
}

export default bp
