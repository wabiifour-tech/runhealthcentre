// Debug endpoint to check user status - DISABLED IN PRODUCTION (SUPER_ADMIN only in dev)
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  // SECURITY: Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Not available in production',
      message: 'Debug endpoints are disabled in production mode'
    }, { status: 403 })
  }

  // Verify SuperAdmin access (additional security layer for development)
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const userId = searchParams.get('userId')

  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable'
      }, { status: 500 })
    }
    const p = prisma as any

    let users: any[] = []

    const selectFields = {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      initials: true,
      isActive: true,
      isFirstLogin: true,
      approvalStatus: true,
      viewablePassword: true,
      createdAt: true,
      approvedAt: true,
      lastLogin: true
    }

    if (email) {
      // Search by email (case-insensitive using contains)
      users = await p.users.findMany({
        where: {
          email: {
            contains: email.toLowerCase()
          }
        },
        select: selectFields,
        orderBy: { createdAt: 'desc' }
      })
    } else if (userId) {
      // Search by ID
      const user = await p.users.findUnique({
        where: { id: userId },
        select: selectFields
      })
      if (user) {
        users = [user]
      }
    } else {
      // Return all users summary
      users = await p.users.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          approvalStatus: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Create or fix user (SuperAdmin only, development only)
export async function POST(request: NextRequest) {
  // SECURITY: Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Not available in production',
      message: 'Debug endpoints are disabled in production mode'
    }, { status: 403 })
  }

  // Verify SuperAdmin access
  const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 })
  }

  const body = await request.json()
  const { email, password, name, role, department, forceUpdate } = body

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable'
      }, { status: 500 })
    }
    const p = prisma as any

    // Check if user exists
    const existingUser = await p.users.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser && !forceUpdate) {
      return NextResponse.json({
        success: false,
        message: 'User already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        },
        hint: 'Use forceUpdate=true in request body to update password'
      })
    }

    if (existingUser && forceUpdate) {
      // Update existing user password
      const hashedPassword = await bcrypt.hash(password, 12)
      await p.users.update({
        where: { email: email.toLowerCase() },
        data: {
          password: hashedPassword,
          viewablePassword: password,
          isActive: true,
          approvalStatus: 'APPROVED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User password updated and account activated',
        email: email.toLowerCase()
      })
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await bcrypt.hash(password, 12)

    await p.users.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password: hashedPassword,
        viewablePassword: password,
        role: role || 'NURSE',
        department: department || 'General',
        initials: (name || email).substring(0, 2).toUpperCase(),
        isActive: true,
        isFirstLogin: false,
        approvalStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId,
      email: email.toLowerCase()
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
