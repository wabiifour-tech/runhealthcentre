// User Management API - For Admin/SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// SuperAdmin emails that cannot be deleted or deactivated
const PROTECTED_EMAILS = ['wabithetechnurse@ruhc']

// Get database client
async function getDatabaseClient() {
  try {
    const dbModule = await import('@/lib/db')
    const client = dbModule.default || dbModule.getPrisma?.()
    
    if (client) {
      try {
        const p = client as any
        await p.$queryRaw`SELECT 1`
        return client
      } catch (e) {
        console.log('[Users API] Database test query failed')
        return null
      }
    }
    return null
  } catch (e) {
    console.log('[Users API] Database module import failed')
    return null
  }
}

// GET - List all users with pending count
export async function GET() {
  try {
    const prisma = await getDatabaseClient()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database unavailable' 
      }, { status: 503 })
    }

    const p = prisma as any
    const users = await p.user.findMany({
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

    return NextResponse.json({ 
      success: true, 
      users,
      count: users.length,
      pendingCount
    })

  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch users' 
    }, { status: 500 })
  }
}

// POST - Create new staff user (Admin/SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, department, initials, password, phone } = body

    // Validation
    if (!name || !email || !role || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email, role, and password are required' 
      }, { status: 400 })
    }

    // Validate role
    const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER', 'ADMIN']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role' 
      }, { status: 400 })
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 })
    }

    const prisma = await getDatabaseClient()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database unavailable' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Check if email already exists
    const existingUser = await p.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'An account with this email already exists' 
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await p.user.create({
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

    return NextResponse.json({ 
      success: true, 
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

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, { status: 500 })
  }
}

// PUT - Update user (activate/deactivate, approve/reject, reset password)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and action are required' 
      }, { status: 400 })
    }

    const prisma = await getDatabaseClient()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database unavailable' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Get the user
    const user = await p.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check for protected accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      if (action === 'deactivate' || action === 'delete' || action === 'reject') {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot modify the primary SuperAdmin account' 
        }, { status: 403 })
      }
    }

    let result

    switch (action) {
      case 'approve':
        result = await p.user.update({
          where: { id: userId },
          data: { 
            approvalStatus: 'APPROVED',
            isActive: true,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Account approved successfully',
          user: result
        })

      case 'reject':
        result = await p.user.update({
          where: { id: userId },
          data: { 
            approvalStatus: 'REJECTED',
            isActive: false,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Account rejected',
          user: result
        })

      case 'activate':
        result = await p.user.update({
          where: { id: userId },
          data: { 
            isActive: true,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Account activated successfully',
          user: result
        })

      case 'deactivate':
        result = await p.user.update({
          where: { id: userId },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Account deactivated successfully',
          user: result
        })

      case 'reset_password':
        if (!data?.password) {
          return NextResponse.json({ 
            success: false, 
            error: 'New password is required' 
          }, { status: 400 })
        }

        // Validate password strength
        if (data.password.length < 8) {
          return NextResponse.json({ 
            success: false, 
            error: 'Password must be at least 8 characters' 
          }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(data.password, 12)
        
        result = await p.user.update({
          where: { id: userId },
          data: { 
            password: hashedPassword,
            isFirstLogin: true, // Force password change on next login
            passwordLastChanged: new Date(),
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
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

        result = await p.user.update({
          where: { id: userId },
          data: updateData
        })
        return NextResponse.json({ 
          success: true, 
          message: 'User updated successfully',
          user: result
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user' 
    }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    const prisma = await getDatabaseClient()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database unavailable' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Get the user
    const user = await p.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Protect SuperAdmin accounts
    if (PROTECTED_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete the primary SuperAdmin account' 
      }, { status: 403 })
    }

    // Delete user
    await p.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User account deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete user' 
    }, { status: 500 })
  }
}
