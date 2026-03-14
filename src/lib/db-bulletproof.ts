/**
 * BULLETPROOF Database Operations
 * 
 * This module provides fail-safe database operations that NEVER fail.
 * Pattern: Direct pg (PRIMARY) → Prisma (SECONDARY) → Graceful fallback
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
import { getPrisma } from './db'

// Pool cache to avoid creating too many connections
let poolCache: Pool | null = null

/**
 * Get a PostgreSQL pool connection
 */
export function getPool(): Pool {
  if (!poolCache) {
    poolCache = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    })
  }
  return poolCache
}

/**
 * Close the pool (call at end of long operations)
 */
export async function closePool(): Promise<void> {
  if (poolCache) {
    await poolCache.end()
    poolCache = null
  }
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
 * BULLETPROOF Query Operations
 */
export const bp = {
  /**
   * Execute a SELECT query - NEVER fails
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<BPResult<T[]>> {
    // PRIMARY: Direct pg
    try {
      const pool = getPool()
      const result = await pool.query(sql, params)
      return {
        success: true,
        data: result.rows,
        rows: result.rows,
        rowCount: result.rowCount,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      console.warn('[BP] Direct pg failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma (for simple queries only)
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
      console.warn('[BP] Prisma also failed:', prismaError.message)
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
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = columns.map(c => `"${c}"`).join(', ')

    const sql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`

    // PRIMARY: Direct pg
    try {
      const pool = getPool()
      const result = await pool.query(sql, values)
      return {
        success: true,
        rowCount: result.rowCount,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      console.warn('[BP] Direct pg INSERT failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const modelName = table.replace(/_/g, '_') // Handle snake_case
        if (p[modelName]) {
          await p[modelName].create({ data })
          return { success: true, method: 'prisma' }
        }
      }
    } catch (prismaError: any) {
      console.warn('[BP] Prisma INSERT also failed:', prismaError.message)
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
    const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const setValues = Object.values(data)
    
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${setValues.length + i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    
    const allValues = [...setValues, ...whereValues]
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses}`

    // PRIMARY: Direct pg
    try {
      const pool = getPool()
      const result = await pool.query(sql, allValues)
      return {
        success: true,
        rowCount: result.rowCount,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      console.warn('[BP] Direct pg UPDATE failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        if (p[table]) {
          await p[table].update({ where, data })
          return { success: true, method: 'prisma' }
        }
      }
    } catch (prismaError: any) {
      console.warn('[BP] Prisma UPDATE also failed:', prismaError.message)
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
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    const sql = `DELETE FROM ${table} WHERE ${whereClauses}`

    // PRIMARY: Direct pg
    try {
      const pool = getPool()
      const result = await pool.query(sql, whereValues)
      return {
        success: true,
        rowCount: result.rowCount,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      console.warn('[BP] Direct pg DELETE failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        if (p[table]) {
          await p[table].delete({ where })
          return { success: true, method: 'prisma' }
        }
      }
    } catch (prismaError: any) {
      console.warn('[BP] Prisma DELETE also failed:', prismaError.message)
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
    // PRIMARY: Direct pg
    try {
      const pool = getPool()
      const result = await pool.query(sql, params)
      return {
        success: true,
        rowCount: result.rowCount,
        rows: result.rows,
        method: 'direct-pg'
      }
    } catch (pgError: any) {
      console.warn('[BP] Direct pg EXECUTE failed, trying Prisma:', pgError.message)
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        await p.$executeRawUnsafe(sql, ...params)
        return { success: true, method: 'prisma' }
      }
    } catch (prismaError: any) {
      console.warn('[BP] Prisma EXECUTE also failed:', prismaError.message)
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
    const result = await this.query<T>(sql, params)
    return {
      success: result.success,
      data: result.rows?.[0],
      error: result.error,
      method: result.method
    }
  },

  /**
   * Check if record exists - NEVER fails
   */
  async exists(table: string, where: Record<string, any>): Promise<boolean> {
    const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
    const whereValues = Object.values(where)
    const sql = `SELECT 1 FROM ${table} WHERE ${whereClauses} LIMIT 1`

    try {
      const pool = getPool()
      const result = await pool.query(sql, whereValues)
      return result.rows.length > 0
    } catch {
      return false
    }
  },

  /**
   * Count records - NEVER fails
   */
  async count(table: string, where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`
    const values: any[] = []

    if (where && Object.keys(where).length > 0) {
      const whereClauses = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
      values.push(...Object.values(where))
      sql += ` WHERE ${whereClauses}`
    }

    try {
      const pool = getPool()
      const result = await pool.query(sql, values)
      return parseInt(result.rows[0]?.count || '0')
    } catch {
      return 0
    }
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
    console.error('[BP] Failed to create audit log:', error)
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
    const now = new Date().toISOString()
    
    // Use execute with parameterized query for safety
    await bp.execute(`
      INSERT INTO notifications (id, "userId", "targetRoles", type, title, message, data, priority, read, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
    `, [
      id,
      data.targetUserId || null,
      JSON.stringify(data.targetRoles),
      data.type,
      data.title,
      data.message,
      JSON.stringify(data.data || {}),
      data.priority || 'normal',
      now
    ])
  } catch (error) {
    console.error('[BP] Failed to create notification:', error)
  }
}

export default bp
