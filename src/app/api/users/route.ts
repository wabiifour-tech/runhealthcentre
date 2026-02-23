// Users API - Uses Prisma Database
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'

// GET - Fetch all users
export async function GET() {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available',
        mode: 'demo'
      }, { status: 503 })
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

    return NextResponse.json({
      success: true,
      users,
      persistent: true
    })
  } catch (error: any) {
    console.error('GET users error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create, update, or delete users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, user, users: syncUsers } = body
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available',
        mode: 'demo'
      }, { status: 503 })
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
        
        return NextResponse.json({
          success: true,
          users: allUsers,
          persistent: true
        })
      }
    }

    if (action === 'add') {
      if (!user?.email) {
        return NextResponse.json({
          success: false,
          error: 'Email is required'
        }, { status: 400 })
      }

      // Check if user exists
      const existing = await p.users.findUnique({ where: { email: user.email.toLowerCase() } })
      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'User with this email already exists'
        }, { status: 400 })
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

      return NextResponse.json({
        success: true,
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
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 })
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

      return NextResponse.json({
        success: true,
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
        return NextResponse.json({
          success: false,
          error: 'User ID is required'
        }, { status: 400 })
      }

      await p.users.delete({ where: { id: user.id } })

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
        persistent: true
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error: any) {
    console.error('POST users error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 503 })
    }

    const p = prisma as any
    await p.users.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('DELETE user error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
