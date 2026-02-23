// User Management API - For Admin/SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors, ApiError, ErrorType } from '@/lib/errors'
import { authenticateRequest, isAdmin } from '@/lib/auth-middleware'

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

    const prisma = await getPrisma()
    
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any
    const users = await p.users.findMany({
      select: {
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
        passwordLastChanged: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Count pending approvals
    const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length

    logger.info('Users list retrieved', { 
      admin: auth.user?.email, 
      count: users.length, 
      pendingCount 
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

    // Create user
    const newUser = await p.users.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
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
      if (action === 'deactivate' || action === 'delete' || action === 'reject') {
        throw Errors.forbidden('Cannot modify the primary SuperAdmin account')
      }
    }

    let result

    switch (action) {
      case 'approve':
        result = await p.users.update({
          where: { id: userId },
          data: { 
            approvalStatus: 'APPROVED',
            isActive: true,
            updatedAt: new Date()
          }
        })
        logger.info('User approved', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Account approved successfully',
          user: result
        })

      case 'reject':
        result = await p.users.update({
          where: { id: userId },
          data: { 
            approvalStatus: 'REJECTED',
            isActive: false,
            updatedAt: new Date()
          }
        })
        logger.info('User rejected', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Account rejected',
          user: result
        })

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
            isFirstLogin: true, // Force password change on next login
            passwordLastChanged: new Date(),
            updatedAt: new Date()
          }
        })
        logger.info('User password reset', { admin: auth.user?.email, targetUser: user.email })
        return successResponse({ 
          message: 'Password reset successfully. User must change password on next login.',
          user: result
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
