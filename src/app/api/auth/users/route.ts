// User Management API - Using Prisma/SQLite
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('UserManagement')

// SuperAdmin emails that cannot be deleted or deactivated
const PROTECTED_EMAILS = ['wabithetechnurse@ruhc']

// GET - List all users with pending count (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN'

    const prisma = await getPrisma()
    if (!prisma) {
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

    const emailLower = email.toLowerCase()
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await bcrypt.hash(password, 12)
    const userInitials = initials || name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    // Check if email already exists
    const existingUser = await p.users.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
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
        createdAt: new Date(),
        updatedAt: new Date()
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

    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    // Get user first to check protections
    const user = await p.users.findUnique({ where: { id: userId } })

    if (!user) {
      throw Errors.notFound('User not found')
    }

    // Check for protected accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      if (action === 'deactivate' || action === 'delete' || action === 'reject') {
        throw Errors.forbidden('Cannot modify the primary SuperAdmin account')
      }
    }

    const adminId = auth.user?.id
    const adminName = auth.user?.name || auth.user?.email
    const now = new Date()

    // Handle each action
    switch (action) {
      case 'approve':
      case 'reject': {
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
        const newIsActive = action === 'approve'
        
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

        // Create audit log
        try {
          await p.audit_logs.create({
            data: {
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: adminId,
              userName: adminName,
              action: action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
              description: `${adminName} ${action}ed user ${user.name} (${user.email}) as ${user.role}`,
              metadata: JSON.stringify({ targetUserId: userId, targetUserEmail: user.email, targetUserRole: user.role }),
              timestamp: now
            }
          })
        } catch {}

        logger.info(`User ${action}ed`, { admin: auth.user?.email, targetUser: user.email })
        
        return successResponse({ 
          message: `Account ${action}ed successfully`,
          userId,
          newStatus
        })
      }

      case 'activate': {
        await p.users.update({
          where: { id: userId },
          data: { isActive: true, updatedAt: now }
        })
        
        logger.info('User activated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ message: 'Account activated successfully', userId })
      }

      case 'deactivate': {
        await p.users.update({
          where: { id: userId },
          data: { isActive: false, updatedAt: now }
        })
        
        logger.info('User deactivated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ message: 'Account deactivated successfully', userId })
      }

      case 'reset_password': {
        if (!data?.password) {
          throw Errors.validation('New password is required')
        }

        if (data.password.length < 8) {
          throw Errors.validation('Password must be at least 8 characters')
        }

        const hashedPassword = await bcrypt.hash(data.password, 12)

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

        logger.info('User password reset', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Password reset successfully. User must change password on next login.',
          userId,
          viewablePassword: data.password
        })
      }

      case 'view_password': {
        // Only SuperAdmin can view passwords
        if (auth.user?.role !== 'SUPER_ADMIN') {
          throw Errors.forbidden('Only SuperAdmin can view user passwords')
        }

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
          throw Errors.notFound('User not found')
        }

        logger.info('Password viewed by SuperAdmin', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ user: userWithPassword })
      }

      case 'update': {
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

        logger.info('User updated', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ message: 'User updated successfully', userId })
      }

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

    // Get user first
    const user = await p.users.findUnique({ where: { id: userId } })

    if (!user) {
      throw Errors.notFound('User not found')
    }

    // Protect SuperAdmin accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      throw Errors.forbidden('Cannot delete the primary SuperAdmin account')
    }

    // Delete user
    await p.users.delete({ where: { id: userId } })
    
    logger.info('User deleted', { admin: auth.user?.email, targetUser: user.email })
    return successResponse({ message: 'User account deleted successfully' })

  } catch (error) {
    return errorResponse(error, { module: 'UserManagement', operation: 'delete' })
  }
}
