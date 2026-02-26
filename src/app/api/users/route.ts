// Users API - Uses Prisma Database
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('Users')

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const prisma = await getPrisma()
    
    if (!prisma) {
      throw Errors.database('Database not available')
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
        phone: true,
        dateOfBirth: true,
        isActive: true,
        isFirstLogin: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    logger.debug('Users fetched', { count: users.length, admin: auth.user?.email })

    return successResponse({
      users,
      persistent: true
    })
  } catch (error) {
    return errorResponse(error, { module: 'Users', operation: 'list' })
  }
}

// POST - Create, update, or delete users (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const body = await request.json()
    const { action, user, users: syncUsers } = body
    const prisma = await getPrisma()

    if (!prisma) {
      throw Errors.database('Database not available')
    }

    const p = prisma as any
    const now = new Date().toISOString()

    if (action === 'sync') {
      // Sync users from client - update existing, create new
      if (syncUsers && Array.isArray(syncUsers)) {
        for (const u of syncUsers) {
          const existing = await p.users.findUnique({ where: { id: u.id } })
          if (existing) {
            await p.users.update({
              where: { id: u.id },
              data: {
                name: u.name,
                role: u.role,
                department: u.department,
                initials: u.initials,
                phone: u.phone,
                dateOfBirth: u.dateOfBirth,
                isActive: u.isActive ?? true,
                updatedAt: now
              }
            })
          } else {
            // Hash password if provided, otherwise use default
            const passwordHash = u.password 
              ? (u.password.startsWith('$2') ? u.password : await bcrypt.hash(u.password, 12))
              : await bcrypt.hash('password123', 12)
            
            await p.users.create({
              data: {
                id: u.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                email: u.email,
                name: u.name,
                role: u.role,
                department: u.department,
                initials: u.initials,
                phone: u.phone,
                dateOfBirth: u.dateOfBirth,
                password: passwordHash,
                isActive: u.isActive ?? true,
                isFirstLogin: u.isFirstLogin ?? true,
                createdAt: u.createdAt || now,
                updatedAt: now
              }
            })
          }
        }
        
        const allUsers = await p.users.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            initials: true,
            phone: true,
            dateOfBirth: true,
            isActive: true,
            isFirstLogin: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        })
        
        logger.info('Users synced', { count: syncUsers.length, admin: auth.user?.email })
        
        return successResponse({
          users: allUsers,
          persistent: true
        })
      }
    }

    if (action === 'add') {
      if (!user?.email) {
        throw Errors.validation('Email is required')
      }

      // Check if user exists
      const existing = await p.users.findUnique({ where: { email: user.email.toLowerCase() } })
      if (existing) {
        throw Errors.validation('User with this email already exists')
      }

      // Hash password
      const passwordHash = user.password 
        ? await bcrypt.hash(user.password, 12)
        : await bcrypt.hash('password123', 12)

      const newUser = await p.users.create({
        data: {
          id: user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: user.email.toLowerCase(),
          name: user.name,
          role: user.role || 'NURSE',
          department: user.department,
          initials: user.initials,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          password: passwordHash,
          isActive: user.isActive ?? true,
          isFirstLogin: user.isFirstLogin ?? true,
          createdAt: now,
          updatedAt: now
        }
      })

      logger.info('User added', { email: newUser.email, role: newUser.role, admin: auth.user?.email })

      return successResponse({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          initials: newUser.initials,
          isActive: newUser.isActive,
          isFirstLogin: newUser.isFirstLogin
        },
        persistent: true
      })
    }

    if (action === 'update') {
      if (!user?.id) {
        throw Errors.validation('User ID is required')
      }

      const updateData: any = {
        name: user.name,
        role: user.role,
        department: user.department,
        initials: user.initials,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        isActive: user.isActive,
        updatedAt: now
      }

      // Only update password if provided
      if (user.password && !user.password.startsWith('$2')) {
        updateData.password = await bcrypt.hash(user.password, 12)
        updateData.isFirstLogin = false
      }

      const updatedUser = await p.users.update({
        where: { id: user.id },
        data: updateData
      })

      logger.info('User updated', { userId: user.id, admin: auth.user?.email })

      return successResponse({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          department: updatedUser.department,
          initials: updatedUser.initials,
          isActive: updatedUser.isActive,
          isFirstLogin: updatedUser.isFirstLogin
        },
        persistent: true
      })
    }

    if (action === 'delete') {
      if (!user?.id) {
        throw Errors.validation('User ID is required')
      }

      await p.users.delete({ where: { id: user.id } })

      logger.info('User deleted', { userId: user.id, admin: auth.user?.email })

      return successResponse({
        message: 'User deleted successfully',
        persistent: true
      })
    }

    throw Errors.validation('Invalid action')

  } catch (error) {
    return errorResponse(error, { module: 'Users', operation: 'modify' })
  }
}

// DELETE - Delete a user (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw Errors.validation('User ID is required')
    }

    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database not available')
    }

    const p = prisma as any
    await p.users.delete({ where: { id } })

    logger.info('User deleted', { userId: id, admin: auth.user?.email })

    return successResponse({
      message: 'User deleted successfully'
    })
  } catch (error) {
    return errorResponse(error, { module: 'Users', operation: 'delete' })
  }
}
