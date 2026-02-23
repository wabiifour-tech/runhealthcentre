// User Registration API - Self-Registration with Admin Approval
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma, testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Register')

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

    logger.debug('Registration request', { email, role, name })

    // Validation
    if (!name || !email || !password || !role) {
      throw Errors.validation('Name, email, password, and role are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw Errors.validation('Please enter a valid email address')
    }

    // Validate password strength
    if (password.length < 8) {
      throw Errors.validation('Password must be at least 8 characters')
    }

    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw Errors.validation('Password must contain uppercase, lowercase, number, and special character')
    }

    // Validate role
    const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']
    if (!allowedRoles.includes(role)) {
      throw Errors.validation('Invalid role. You can only register as Doctor, Nurse, Pharmacist, Lab Technician, Matron, or Records Officer.')
    }

    // Test database connection first
    const dbTest = await testConnection()
    
    if (!dbTest.success) {
      logger.error('Database connection failed', { message: dbTest.message })
      throw Errors.database('Database connection failed. Please try again later.')
    }

    // Get Prisma client
    const prisma = await getPrisma()
    
    if (!prisma) {
      throw Errors.database('Database client unavailable')
    }

    const p = prisma as any

    // Check if email already exists
    const existingUser = await p.users.findUnique({
      where: { email: email.toLowerCase() }
    }).catch((err: Error) => {
      logger.error('Error checking existing user', { error: err.message })
      return null
    })

    if (existingUser) {
      throw Errors.validation('An account with this email already exists. Please sign in instead.')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate initials
    const userInitials = initials || generateInitials(name)

    // Create user with PENDING approval status
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
      logger.error('Error creating user', { error: err.message })
      throw Errors.database('Failed to create user account')
    })

    logger.info('User registered', { 
      userId: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    })

    return successResponse({ 
      message: 'Registration successful! Your account is pending approval. You will be notified once an administrator reviews your application.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        approvalStatus: newUser.approvalStatus
      }
    })

  } catch (error) {
    return errorResponse(error, { module: 'Register', operation: 'create' })
  }
}
