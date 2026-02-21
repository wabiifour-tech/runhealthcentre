// User Registration API - Self-Registration with Admin Approval
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// POST - Self-registration (creates pending account)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, department, initials, phone, dateOfBirth } = body

    console.log('[Register] Registration request for:', email, 'role:', role)

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email, password, and role are required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 })
    }

    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      }, { status: 400 })
    }

    // Validate role
    const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role. You can only register as Doctor, Nurse, Pharmacist, Lab Technician, or Matron.' 
      }, { status: 400 })
    }

    // Get database client
    const { getPrisma } = await import('@/lib/db')
    const prisma = getPrisma()
    
    if (!prisma) {
      console.log('[Register] Database unavailable - client is null')
      return NextResponse.json({ 
        success: false, 
        error: 'Registration temporarily unavailable. Please contact administrator.' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Check if email already exists
    try {
      const existingUser = await p.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please sign in instead.' 
        }, { status: 400 })
      }
    } catch (findError: any) {
      console.error('[Register] Find user error:', findError.message)
      // Continue - table might not exist yet
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate initials
    const userInitials = initials || name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    // Create user
    try {
      const newUser = await p.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          role,
          department: department || null,
          initials: userInitials,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          isActive: true,
          isFirstLogin: false,
          approvalStatus: 'PENDING',
          createdAt: new Date()
        }
      })

      console.log('[Register] User created:', newUser.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Registration successful! Your account is pending approval.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          approvalStatus: newUser.approvalStatus
        }
      })
    } catch (createError: any) {
      console.error('[Register] Create user error:', createError.message)
      console.error('[Register] Error code:', createError.code)
      
      // Check for specific Prisma errors
      if (createError.code === 'P2021') {
        return NextResponse.json({ 
          success: false, 
          error: 'User table does not exist. Please run database migrations first.' 
        }, { status: 500 })
      }
      
      if (createError.code === 'P2002') {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Database error: ${createError.message}` 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[Register] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Registration failed: ${error.message}` 
    }, { status: 500 })
  }
}
