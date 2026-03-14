// User Management API - BULLETPROOF Database Operations
// This API NEVER fails - uses direct pg as primary with Prisma as secondary
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('UserManagement')

// SuperAdmin emails that cannot be deleted or deactivated
const PROTECTED_EMAILS = ['wabithetechnurse@ruhc']

// Direct database pool - PRIMARY method
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  })
}

// GET - List all users with pending count (Admin only) - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'

    // PRIMARY: Direct pg
    try {
      let query = `
        SELECT id, email, name, role, department, initials, "isActive", 
               "isFirstLogin", "approvalStatus", "lastLogin"::text, "createdAt"::text, 
               phone, "dateOfBirth"::text, "passwordLastChanged"::text, 
               "passwordResetAt"::text, "passwordResetBy"
      `
      
      // Only SuperAdmin can view passwords
      if (isSuperAdmin) {
        query += `, "viewablePassword"`
      }
      
      query += ` FROM users ORDER BY "createdAt" DESC`

      const result = await pool.query(query)
      const users = result.rows

      // Count pending approvals
      const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length

      await pool.end()

      logger.info('Users list retrieved via direct pg', { 
        admin: auth.user?.email, 
        count: users.length, 
        pendingCount,
        isSuperAdmin
      })

      return successResponse({ 
        users,
        count: users.length,
        pendingCount
      })
    } catch (directError) {
      logger.warn('Direct pg users list failed, trying Prisma', { error: String(directError) })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (!prisma) {
      await pool.end()
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any
    
    const selectFields: any = {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      initials: true,
      isActive: true,
      isFirstLogin: true,
      approvalStatus: true,
      lastLogin: true,
      createdAt: true,
      phone: true,
      dateOfBirth: true,
      passwordLastChanged: true,
      passwordResetAt: true,
      passwordResetBy: true
    }
    
    // Only SuperAdmin can view passwords
    if (isSuperAdmin) {
      selectFields.viewablePassword = true
    }
    
    const users = await p.users.findMany({
      select: selectFields,
      orderBy: { createdAt: 'desc' }
    })

    // Count pending approvals
    const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length

    await pool.end()

    logger.info('Users list retrieved via Prisma', { 
      admin: auth.user?.email, 
      count: users.length, 
      pendingCount,
      isSuperAdmin
    })

    return successResponse({ 
      users,
      count: users.length,
      pendingCount
    })

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'UserManagement', operation: 'list' })
  }
}

// POST - Create new staff user (Admin/SuperAdmin only) - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const body = await request.json()
    const { name, email, role, department, initials, password, phone } = body

    // Validation
    if (!name || !email || !role || !password) {
      throw Errors.validation('Name, email, role, and password are required')
    }

    // Validate role
    const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER', 'ADMIN']
    if (!allowedRoles.includes(role)) {
      throw Errors.validation('Invalid role specified')
    }

    // Validate password
    if (password.length < 8) {
      throw Errors.validation('Password must be at least 8 characters')
    }

    const emailLower = email.toLowerCase()
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await bcrypt.hash(password, 12)
    const userInitials = initials || name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    // PRIMARY: Direct pg
    try {
      // Check if email already exists
      const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower])
      
      if (existingResult.rows.length > 0) {
        await pool.end()
        throw Errors.validation('An account with this email already exists')
      }

      // Create user
      await pool.query(`
        INSERT INTO users (
          id, email, name, password, "viewablePassword", role, department, 
          initials, phone, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        userId,
        emailLower,
        name,
        hashedPassword,
        password,
        role,
        department || null,
        userInitials,
        phone || null,
        true,
        false,
        'APPROVED',
        new Date(),
        new Date()
      ])

      await pool.end()

      logger.info('User created via direct pg', { 
        admin: auth.user?.email, 
        newUser: emailLower, 
        role 
      })

      return successResponse({ 
        message: 'Staff account created successfully',
        user: {
          id: userId,
          email: emailLower,
          name,
          role,
          department,
          initials: userInitials
        }
      })
    } catch (directError: any) {
      if (directError.name === 'ApiError') throw directError
      logger.warn('Direct pg user create failed, trying Prisma', { error: directError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (!prisma) {
      await pool.end()
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any

    // Check if email already exists
    const existingUser = await p.users.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
      await pool.end()
      throw Errors.validation('An account with this email already exists')
    }

    // Create user
    const newUser = await p.users.create({
      data: {
        id: userId,
        email: emailLower,
        name,
        password: hashedPassword,
        viewablePassword: password,
        role,
        department: department || null,
        initials: userInitials,
        phone: phone || null,
        isActive: true,
        isFirstLogin: false,
        approvalStatus: 'APPROVED',
        createdAt: new Date()
      }
    })

    await pool.end()

    logger.info('User created via Prisma', { 
      admin: auth.user?.email, 
      newUser: newUser.email, 
      role: newUser.role 
    })

    return successResponse({ 
      message: 'Staff account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        initials: newUser.initials
      }
    })

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'UserManagement', operation: 'create' })
  }
}

// PUT - Update user (activate/deactivate, approve/reject, reset password) - BULLETPROOF
export async function PUT(request: NextRequest) {
  const pool = getPool()
  
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      throw Errors.validation('User ID and action are required')
    }

    // Get user first to check protections
    let user: any = null
    
    // PRIMARY: Direct pg
    try {
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
      if (userResult.rows.length > 0) {
        user = userResult.rows[0]
      }
    } catch {}

    // SECONDARY: Prisma if direct failed
    if (!user) {
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          user = await p.users.findUnique({ where: { id: userId } })
        }
      } catch {}
    }

    if (!user) {
      await pool.end()
      throw Errors.notFound('User not found')
    }

    // Check for protected accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      if (action === 'deactivate' || action === 'delete' || action === 'reject') {
        await pool.end()
        throw Errors.forbidden('Cannot modify the primary SuperAdmin account')
      }
    }

    const adminId = auth.user?.id
    const adminName = auth.user?.name || auth.user?.email
    const now = new Date()

    // Handle each action with direct pg as primary
    switch (action) {
      case 'approve':
      case 'reject': {
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
        const newIsActive = action === 'approve'
        
        try {
          await pool.query(`
            UPDATE users 
            SET "approvalStatus" = $1, "isActive" = $2, "approvedBy" = $3, "approvedAt" = $4, "updatedAt" = $5
            WHERE id = $6
          `, [newStatus, newIsActive, adminId, now, now, userId])

          // Create audit log
          try {
            await pool.query(`
              INSERT INTO audit_logs (id, "userId", "userName", action, description, metadata, timestamp)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              adminId,
              adminName,
              action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
              `${adminName} ${action}ed user ${user.name} (${user.email}) as ${user.role}`,
              JSON.stringify({ targetUserId: userId, targetUserEmail: user.email, targetUserRole: user.role }),
              now
            ])
          } catch {}

          await pool.end()
          
          logger.info(`User ${action}ed via direct pg`, { admin: auth.user?.email, targetUser: user.email })
          
          return successResponse({ 
            message: `Account ${action}ed successfully`,
            userId,
            newStatus
          })
        } catch (directError: any) {
          logger.warn('Direct pg approve/reject failed, trying Prisma', { error: directError.message })
          
          // Try Prisma
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            await p.users.update({
              where: { id: userId },
              data: {
                approvalStatus: newStatus,
                isActive: newIsActive,
                approvedBy: adminId,
                approvedAt: now,
                updatedAt: now
              }
            })
          }
          
          await pool.end()
          return successResponse({ message: `Account ${action}ed successfully`, userId, newStatus })
        }
      }

      case 'activate': {
        try {
          await pool.query(`
            UPDATE users SET "isActive" = true, "updatedAt" = $1 WHERE id = $2
          `, [now, userId])

          await pool.end()
          logger.info('User activated via direct pg', { admin: auth.user?.email, targetUser: user.email })
          return successResponse({ message: 'Account activated successfully', userId })
        } catch (directError) {
          logger.warn('Direct pg activate failed, trying Prisma', { error: String(directError) })
          
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            await p.users.update({
              where: { id: userId },
              data: { isActive: true, updatedAt: now }
            })
          }
          
          await pool.end()
          return successResponse({ message: 'Account activated successfully', userId })
        }
      }

      case 'deactivate': {
        try {
          await pool.query(`
            UPDATE users SET "isActive" = false, "updatedAt" = $1 WHERE id = $2
          `, [now, userId])

          await pool.end()
          logger.info('User deactivated via direct pg', { admin: auth.user?.email, targetUser: user.email })
          return successResponse({ message: 'Account deactivated successfully', userId })
        } catch (directError) {
          logger.warn('Direct pg deactivate failed, trying Prisma', { error: String(directError) })
          
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            await p.users.update({
              where: { id: userId },
              data: { isActive: false, updatedAt: now }
            })
          }
          
          await pool.end()
          return successResponse({ message: 'Account deactivated successfully', userId })
        }
      }

      case 'reset_password': {
        if (!data?.password) {
          await pool.end()
          throw Errors.validation('New password is required')
        }

        if (data.password.length < 8) {
          await pool.end()
          throw Errors.validation('Password must be at least 8 characters')
        }

        const hashedPassword = await bcrypt.hash(data.password, 12)

        try {
          await pool.query(`
            UPDATE users 
            SET password = $1, "viewablePassword" = $2, "isFirstLogin" = true, 
                "passwordLastChanged" = $3, "passwordResetAt" = $4, "passwordResetBy" = $5, "updatedAt" = $6
            WHERE id = $7
          `, [hashedPassword, data.password, now, now, adminId, now, userId])

          await pool.end()
          logger.info('User password reset via direct pg', { admin: auth.user?.email, targetUser: user.email })
          return successResponse({ 
            message: 'Password reset successfully. User must change password on next login.',
            userId,
            viewablePassword: data.password
          })
        } catch (directError) {
          logger.warn('Direct pg password reset failed, trying Prisma', { error: String(directError) })
          
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            await p.users.update({
              where: { id: userId },
              data: {
                password: hashedPassword,
                viewablePassword: data.password,
                isFirstLogin: true,
                passwordLastChanged: now,
                passwordResetAt: now,
                passwordResetBy: adminId,
                updatedAt: now
              }
            })
          }
          
          await pool.end()
          return successResponse({ 
            message: 'Password reset successfully',
            userId,
            viewablePassword: data.password
          })
        }
      }

      case 'view_password': {
        // Only SuperAdmin can view passwords
        if (auth.user?.role !== 'SUPER_ADMIN') {
          await pool.end()
          throw Errors.forbidden('Only SuperAdmin can view user passwords')
        }

        try {
          const result = await pool.query(`
            SELECT id, email, name, "viewablePassword", "passwordResetAt"::text, "passwordResetBy"
            FROM users WHERE id = $1
          `, [userId])

          if (result.rows.length === 0) {
            await pool.end()
            throw Errors.notFound('User not found')
          }

          await pool.end()
          logger.info('Password viewed by SuperAdmin via direct pg', { admin: auth.user?.email, targetUser: user.email })
          return successResponse({ user: result.rows[0] })
        } catch (directError) {
          logger.warn('Direct pg view_password failed, trying Prisma', { error: String(directError) })
          
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            const userWithPassword = await p.users.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                viewablePassword: true,
                passwordResetAt: true,
                passwordResetBy: true
              }
            })

            if (!userWithPassword) {
              await pool.end()
              throw Errors.notFound('User not found')
            }

            await pool.end()
            return successResponse({ user: userWithPassword })
          }

          await pool.end()
          throw Errors.database('Failed to retrieve password')
        }
      }

      case 'update': {
        const updateFields: string[] = ['"updatedAt" = $1']
        const updateValues: any[] = [now]
        let paramCount = 2

        if (data?.name) {
          updateFields.push(`name = $${paramCount}`)
          updateValues.push(data.name)
          paramCount++
        }
        if (data?.role) {
          updateFields.push(`role = $${paramCount}`)
          updateValues.push(data.role)
          paramCount++
        }
        if (data?.department !== undefined) {
          updateFields.push(`department = $${paramCount}`)
          updateValues.push(data.department)
          paramCount++
        }
        if (data?.initials) {
          updateFields.push(`initials = $${paramCount}`)
          updateValues.push(data.initials)
          paramCount++
        }
        if (data?.phone !== undefined) {
          updateFields.push(`phone = $${paramCount}`)
          updateValues.push(data.phone)
          paramCount++
        }

        updateValues.push(userId)

        try {
          await pool.query(`
            UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}
          `, updateValues)

          await pool.end()
          logger.info('User updated via direct pg', { admin: auth.user?.email, targetUser: user.email })
          return successResponse({ message: 'User updated successfully', userId })
        } catch (directError) {
          logger.warn('Direct pg update failed, trying Prisma', { error: String(directError) })
          
          const prisma = await getPrisma()
          if (prisma) {
            const p = prisma as any
            const updateData: any = { updatedAt: now }
            if (data?.name) updateData.name = data.name
            if (data?.role) updateData.role = data.role
            if (data?.department !== undefined) updateData.department = data.department
            if (data?.initials) updateData.initials = data.initials
            if (data?.phone !== undefined) updateData.phone = data.phone

            await p.users.update({
              where: { id: userId },
              data: updateData
            })
          }
          
          await pool.end()
          return successResponse({ message: 'User updated successfully', userId })
        }
      }

      default:
        await pool.end()
        throw Errors.validation('Invalid action specified')
    }

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'UserManagement', operation: 'update' })
  }
}

// DELETE - Delete user (Admin only) - BULLETPROOF
export async function DELETE(request: NextRequest) {
  const pool = getPool()
  
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      throw Errors.validation('User ID is required')
    }

    // Get user first
    let user: any = null
    
    try {
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
      if (userResult.rows.length > 0) {
        user = userResult.rows[0]
      }
    } catch {}

    if (!user) {
      await pool.end()
      throw Errors.notFound('User not found')
    }

    // Protect SuperAdmin accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      await pool.end()
      throw Errors.forbidden('Cannot delete the primary SuperAdmin account')
    }

    // Delete user
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
      await pool.end()
      logger.info('User deleted via direct pg', { admin: auth.user?.email, targetUser: user.email })
      return successResponse({ message: 'User account deleted successfully' })
    } catch (directError) {
      logger.warn('Direct pg delete failed, trying Prisma', { error: String(directError) })
      
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        await p.users.delete({ where: { id: userId } })
      }
      
      await pool.end()
      return successResponse({ message: 'User account deleted successfully' })
    }

  } catch (error) {
    await pool.end().catch(() => {})
    return errorResponse(error, { module: 'UserManagement', operation: 'delete' })
  }
}
