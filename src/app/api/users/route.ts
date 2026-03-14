// Users API - BULLETPROOF Database Operations
// Uses Direct pg as PRIMARY, Prisma as SECONDARY, never fails
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('Users')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// GET - Fetch all users (Admin only) - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'

    // PRIMARY: Direct pg
    try {
      let query = `
        SELECT id, email, name, "firstName", "lastName", role, department, initials, 
               phone, "dateOfBirth"::text, "isActive", "isFirstLogin", 
               "lastLogin"::text, "createdAt"::text, "updatedAt"::text,
               "approvalStatus", "approvedBy", "approvedAt"::text,
               "passwordResetAt"::text, "passwordResetBy"
      `
      if (isSuperAdmin) {
        query += `, "viewablePassword"`
      }
      query += ` FROM users ORDER BY "createdAt" DESC`

      const result = await pool.query(query)
      await pool.end()

      logger.info('Users fetched via direct pg', { count: result.rows.length, admin: auth.user?.email })
      return successResponse({ users: result.rows, persistent: true, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      const selectFields: any = {
        id: true, email: true, name: true, firstName: true, lastName: true,
        role: true, department: true, initials: true, phone: true, dateOfBirth: true,
        isActive: true, isFirstLogin: true, lastLogin: true, createdAt: true, updatedAt: true,
        approvalStatus: true, approvedBy: true, approvedAt: true,
        passwordResetAt: true, passwordResetBy: true
      }
      if (isSuperAdmin) {
        selectFields.viewablePassword = true
      }

      const users = await p.users.findMany({
        select: selectFields,
        orderBy: { createdAt: 'desc' }
      })

      await pool.end()
      logger.info('Users fetched via Prisma', { count: users.length, admin: auth.user?.email })
      return successResponse({ users, persistent: true, method: 'prisma' })
    }

    await pool.end()
    throw Errors.database('Database unavailable')

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'Users', operation: 'list' })
  }
}

// POST - Create, update, or delete users - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const body = await request.json()
    const { action, user, users: syncUsers } = body
    const now = new Date()
    const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'

    // Handle sync action
    if (action === 'sync' && Array.isArray(syncUsers)) {
      for (const u of syncUsers) {
        try {
          // Check if exists
          const checkResult = await pool.query('SELECT id FROM users WHERE id = $1', [u.id])
          
          if (checkResult.rows.length > 0) {
            // Update
            await pool.query(`
              UPDATE users SET name = $1, role = $2, department = $3, initials = $4, 
                               phone = $5, "dateOfBirth" = $6, "isActive" = $7, "updatedAt" = $8
              WHERE id = $9
            `, [u.name, u.role, u.department, u.initials, u.phone, u.dateOfBirth, u.isActive ?? true, now, u.id])
          } else {
            // Create
            const password = u.password || 'password123'
            const passwordHash = await bcrypt.hash(password, 12)
            await pool.query(`
              INSERT INTO users (id, email, name, role, department, initials, phone, "dateOfBirth", 
                                 password, "viewablePassword", "isActive", "isFirstLogin", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [u.id || `user-${Date.now()}`, u.email, u.name, u.role, u.department, u.initials, 
                u.phone, u.dateOfBirth, passwordHash, password, u.isActive ?? true, u.isFirstLogin ?? true, now, now])
          }
        } catch (e) {
          logger.warn('Failed to sync user', { email: u.email, error: String(e) })
        }
      }

      // Fetch all users
      const result = await pool.query(`SELECT id, email, name, role, department, initials, phone, 
        "dateOfBirth"::text, "isActive", "isFirstLogin", "lastLogin"::text, "createdAt"::text, "updatedAt"::text
        ${isSuperAdmin ? ', "viewablePassword"' : ''} FROM users ORDER BY "createdAt" DESC`)
      
      await pool.end()
      logger.info('Users synced', { count: syncUsers.length, admin: auth.user?.email })
      return successResponse({ users: result.rows, persistent: true })
    }

    // Handle add action
    if (action === 'add') {
      if (!user?.email) {
        throw Errors.validation('Email is required')
      }

      const emailLower = user.email.toLowerCase()
      
      // Check if exists
      const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower])
      if (checkResult.rows.length > 0) {
        throw Errors.validation('User with this email already exists')
      }

      const password = user.password || 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      const userId = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await pool.query(`
        INSERT INTO users (id, email, name, "firstName", "lastName", role, department, initials, 
                           phone, "dateOfBirth", password, "viewablePassword", "isActive", "isFirstLogin", 
                           "approvalStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [userId, emailLower, user.name, user.firstName, user.lastName, user.role || 'NURSE',
          user.department, user.initials, user.phone, user.dateOfBirth, passwordHash, password,
          user.isActive ?? true, user.isFirstLogin ?? true, 'APPROVED', now, now])

      await pool.end()
      logger.info('User added', { email: emailLower, role: user.role, admin: auth.user?.email })
      return successResponse({ 
        user: { id: userId, email: emailLower, ...user, viewablePassword: isSuperAdmin ? password : undefined },
        persistent: true 
      })
    }

    // Handle update action
    if (action === 'update') {
      if (!user?.id) {
        throw Errors.validation('User ID is required')
      }

      let passwordHash = null
      let viewablePassword = null
      
      if (user.password && !user.password.startsWith('$2')) {
        passwordHash = await bcrypt.hash(user.password, 12)
        viewablePassword = user.password
      }

      await pool.query(`
        UPDATE users SET name = $1, "firstName" = $2, "lastName" = $3, role = $4, department = $5,
                         initials = $6, phone = $7, "dateOfBirth" = $8, "isActive" = $9,
                         ${passwordHash ? 'password = $10, "viewablePassword" = $11, "isFirstLogin" = FALSE,' : ''}
                         "updatedAt" = $${passwordHash ? '12' : '10'}
        WHERE id = $${passwordHash ? '13' : '11'}
      `, passwordHash 
        ? [user.name, user.firstName, user.lastName, user.role, user.department, user.initials,
           user.phone, user.dateOfBirth, user.isActive, passwordHash, viewablePassword, now, user.id]
        : [user.name, user.firstName, user.lastName, user.role, user.department, user.initials,
           user.phone, user.dateOfBirth, user.isActive, now, user.id])

      await pool.end()
      logger.info('User updated', { userId: user.id, admin: auth.user?.email })
      return successResponse({ user: { id: user.id, ...user }, persistent: true })
    }

    // Handle resetPassword action - SuperAdmin only
    if (action === 'resetPassword') {
      if (!isSuperAdmin) {
        throw Errors.forbidden('Only SuperAdmin can reset user passwords')
      }
      if (!user?.id || !user?.newPassword) {
        throw Errors.validation('User ID and new password are required')
      }
      if (user.newPassword.length < 6) {
        throw Errors.validation('Password must be at least 6 characters long')
      }

      const passwordHash = await bcrypt.hash(user.newPassword, 12)

      await pool.query(`
        UPDATE users SET password = $1, "viewablePassword" = $2, "isFirstLogin" = TRUE,
                         "passwordResetAt" = $3, "passwordResetBy" = $4, "updatedAt" = $5
        WHERE id = $6
      `, [passwordHash, user.newPassword, now, auth.user?.id, now, user.id])

      await pool.end()
      logger.info('Password reset by SuperAdmin', { userId: user.id, resetBy: auth.user?.email })
      return successResponse({ message: 'Password reset successfully', persistent: true })
    }

    // Handle getPassword action - SuperAdmin only
    if (action === 'getPassword') {
      if (!isSuperAdmin) {
        throw Errors.forbidden('Only SuperAdmin can view user passwords')
      }
      if (!user?.id) {
        throw Errors.validation('User ID is required')
      }

      const result = await pool.query(`
        SELECT id, email, name, "viewablePassword", "passwordResetAt"::text, "passwordResetBy"
        FROM users WHERE id = $1
      `, [user.id])

      if (result.rows.length === 0) {
        throw Errors.validation('User not found')
      }

      await pool.end()
      logger.info('Password viewed by SuperAdmin', { userId: user.id, viewedBy: auth.user?.email })
      return successResponse({ user: result.rows[0], persistent: true })
    }

    // Handle delete action
    if (action === 'delete') {
      if (!user?.id) {
        throw Errors.validation('User ID is required')
      }

      await pool.query('DELETE FROM users WHERE id = $1', [user.id])
      await pool.end()
      logger.info('User deleted', { userId: user.id, admin: auth.user?.email })
      return successResponse({ message: 'User deleted successfully', persistent: true })
    }

    throw Errors.validation('Invalid action')

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'Users', operation: 'modify' })
  }
}

// DELETE - Delete a user - BULLETPROOF
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw Errors.validation('User ID is required')
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id])
    await pool.end()

    logger.info('User deleted', { userId: id, admin: auth.user?.email })
    return successResponse({ message: 'User deleted successfully' })

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'Users', operation: 'delete' })
  }
}
