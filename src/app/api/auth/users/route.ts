// User Management API - For Admin/SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors, ApiError, ErrorType } from '@/lib/errors'
import { authenticateRequest, isAdmin } from '@/lib/auth-middleware'

const logger = createLogger('UserManagement')

// SuperAdmin emails that cannot be deleted or deactivated
const PROTECTED_EMAILS = ['wabithetechnurse@ruhc']

// Direct database connection as fallback
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// GET - List all users with pending count (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const prisma = await getPrisma()
    
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any
    const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'
    
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

    logger.info('Users list retrieved', { 
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
    return errorResponse(error, { module: 'UserManagement', operation: 'list' })
  }
}

// POST - Create new staff user (Admin/SuperAdmin only)
export async function POST(request: NextRequest) {
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

    const prisma = await getPrisma()

    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any

    // Check if email already exists
    const existingUser = await p.users.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      throw Errors.validation('An account with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with viewablePassword for SuperAdmin to see
    const newUser = await p.users.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        viewablePassword: password, // Store plain text for SuperAdmin viewing
        role,
        department: department || null,
        initials: initials || name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        phone: phone || null,
        isActive: true,
        isFirstLogin: false,
        approvalStatus: 'APPROVED',
        createdAt: new Date()
      }
    })

    logger.info('User created', { 
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
    return errorResponse(error, { module: 'UserManagement', operation: 'create' })
  }
}

// PUT - Update user (activate/deactivate, approve/reject, reset password)
export async function PUT(request: NextRequest) {
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

    // For approve/reject, use direct database for reliability
    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
      const pool = getPool()
      
      try {
        // Get user first
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
        
        if (userResult.rows.length === 0) {
          await pool.end()
          throw Errors.notFound('User not found')
        }
        
        const user = userResult.rows[0]
        
        // Check for protected accounts
        if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
          await pool.end()
          throw Errors.forbidden('Cannot modify the primary SuperAdmin account')
        }
        
        // Update user status
        await pool.query(`
          UPDATE users 
          SET "approvalStatus" = $1, "isActive" = $2, "approvedBy" = $3, "approvedAt" = $4, "updatedAt" = $5
          WHERE id = $6
        `, [newStatus, action === 'approve', auth.user?.id, new Date(), new Date(), userId])
        
        // Create audit log
        try {
          await pool.query(`
            INSERT INTO audit_logs (id, "userId", "userName", action, description, metadata, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            auth.user?.id,
            auth.user?.name || auth.user?.email,
            action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
            `${auth.user?.name} ${action}ed user ${user.name} (${user.email}) as ${user.role}`,
            JSON.stringify({ targetUserId: userId, targetUserEmail: user.email, targetUserRole: user.role }),
            new Date()
          ])
        } catch {
          // Ignore audit errors
        }
        
        await pool.end()
        
        logger.info(`User ${action}ed via direct pg`, { admin: auth.user?.email, targetUser: user.email })
        
        return successResponse({ 
          message: `Account ${action}ed successfully`,
          userId,
          newStatus
        })
      } catch (dbError: any) {
        await pool.end()
        throw dbError
      }
    }

    // For other actions, try Prisma
    const prisma = await getPrisma()

    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any

    // Get the user
    const user = await p.users.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw Errors.notFound('User')
    }

    // Check for protected accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      if (action === 'deactivate' || action === 'delete') {
        throw Errors.forbidden('Cannot modify the primary SuperAdmin account')
      }
    }

    let result

    switch (action) {
      case 'activate':
        result = await p.users.update({
          where: { id: userId },
          data: { 
            isActive: true,
            updatedAt: new Date()
          }
        })
        logger.info('User activated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Account activated successfully',
          user: result
        })

      case 'deactivate':
        result = await p.users.update({
          where: { id: userId },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        })
        logger.info('User deactivated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Account deactivated successfully',
          user: result
        })

      case 'reset_password':
        if (!data?.password) {
          throw Errors.validation('New password is required')
        }

        // Validate password strength
        if (data.password.length < 8) {
          throw Errors.validation('Password must be at least 8 characters')
        }

        const hashedPassword = await bcrypt.hash(data.password, 12)
        
        result = await p.users.update({
          where: { id: userId },
          data: { 
            password: hashedPassword,
            viewablePassword: data.password, // Store plain text for SuperAdmin viewing
            isFirstLogin: true, // Force password change on next login
            passwordLastChanged: new Date(),
            passwordResetAt: new Date(),
            passwordResetBy: auth.user?.id,
            updatedAt: new Date()
          }
        })
        logger.info('User password reset', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Password reset successfully. User must change password on next login.',
          user: result,
          viewablePassword: data.password
        })

      case 'view_password':
        // Only SuperAdmin can view passwords
        if (auth.user?.role !== 'SUPER_ADMIN') {
          throw Errors.forbidden('Only SuperAdmin can view user passwords')
        }
        
        // Get the user with viewablePassword
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
          throw Errors.notFound('User')
        }
        
        logger.info('Password viewed by SuperAdmin', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          user: userWithPassword
        })

      case 'update':
        const updateData: any = { updatedAt: new Date() }
        if (data?.name) updateData.name = data.name
        if (data?.role) updateData.role = data.role
        if (data?.department !== undefined) updateData.department = data.department
        if (data?.initials) updateData.initials = data.initials
        if (data?.phone !== undefined) updateData.phone = data.phone

        result = await p.users.update({
          where: { id: userId },
          data: updateData
        })
        logger.info('User updated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'User updated successfully',
          user: result
        })

      default:
        throw Errors.validation('Invalid action specified')
    }

  } catch (error) {
    return errorResponse(error, { module: 'UserManagement', operation: 'update' })
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(request: NextRequest) {
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

    const prisma = await getPrisma()

    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any

    // Get the user
    const user = await p.users.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw Errors.notFound('User')
    }

    // Protect SuperAdmin accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      throw Errors.forbidden('Cannot delete the primary SuperAdmin account')
    }

    // Delete user
    await p.users.delete({
      where: { id: userId }
    })

    logger.info('User deleted', { admin: auth.user?.email, targetUser: user.email })

    return successResponse({ 
      message: 'User account deleted successfully'
    })

  } catch (error) {
    return errorResponse(error, { module: 'UserManagement', operation: 'delete' })
  }
}
