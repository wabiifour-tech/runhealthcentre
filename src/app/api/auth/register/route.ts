// User Registration API - Self-Registration with Admin Approval
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma, testConnection } from '@/lib/db'

// Generate initials from name
function generateInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// POST - Self-registration (creates pending account)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, department, initials, phone, dateOfBirth } = body

    console.log('[Register] ====== REGISTRATION REQUEST ======')
    console.log('[Register] Email:', email)
    console.log('[Register] Role:', role)
    console.log('[Register] Name:', name)

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
    const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role. You can only register as Doctor, Nurse, Pharmacist, Lab Technician, Matron, or Records Officer.' 
      }, { status: 400 })
    }

    // Test database connection first
    console.log('[Register] Testing database connection...')
    const dbTest = await testConnection()
    
    if (!dbTest.success) {
      console.error('[Register] Database connection failed:', dbTest.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed. Please try again later or contact administrator.',
        debug: process.env.NODE_ENV === 'development' ? {
          message: dbTest.message,
          details: dbTest.details
        } : undefined
      }, { status: 503 })
    }

    console.log('[Register] Database connected successfully')

    // Get Prisma client
    const prisma = await getPrisma()
    
    if (!prisma) {
      console.error('[Register] Failed to get Prisma client')
      return NextResponse.json({ 
        success: false, 
        error: 'Database client unavailable. Please contact administrator.' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Check if email already exists
    console.log('[Register] Checking if email exists...')
    const existingUser = await p.users.findUnique({
      where: { email: email.toLowerCase() }
    }).catch((err: Error) => {
      console.error('[Register] Error checking existing user:', err.message)
      return null
    })

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, { status: 400 })
    }

    // Hash password
    console.log('[Register] Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate initials
    const userInitials = initials || generateInitials(name)

    // Create user with PENDING approval status
    console.log('[Register] Creating user...')
    const newUser = await p.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    }).catch((err: Error) => {
      console.error('[Register] Error creating user:', err.message)
      throw err
    })

    console.log('[Register] ✅ User created successfully:', newUser.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful! Your account is pending approval. You will be notified once an administrator reviews your application.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        approvalStatus: newUser.approvalStatus
      }
    })

  } catch (error: any) {
    console.error('[Register] ❌ Registration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Registration failed. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
