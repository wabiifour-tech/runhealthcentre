// New User Registration API - Multi-step with Auto-generated Email (@ruhc)
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma, testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Signup')

// Generate auto email from first name and last name
function generateAutoEmail(firstName: string, lastName: string): string {
  // Remove spaces, special characters, and convert to lowercase
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '')
  
  // Combine first + last name @ruhc
  return `${cleanFirst}${cleanLast}@ruhc`
}

// Generate initials from name
function generateInitials(firstName: string, lastName: string): string {
  return (firstName[0] + lastName[0]).toUpperCase()
}

// POST - Step-by-step registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, firstName, lastName, email, password, confirmPassword, role, department, phone } = body

    logger.info('Registration request', { step, firstName, lastName, email })

    // Step 1: Generate email from first name and last name
    if (step === 'generate_email') {
      if (!firstName || !lastName) {
        throw Errors.validation('First name and last name are required')
      }

      if (firstName.trim().length < 2 || lastName.trim().length < 2) {
        throw Errors.validation('Names must be at least 2 characters')
      }

      // Generate the auto email
      const autoEmail = generateAutoEmail(firstName.trim(), lastName.trim())

      // Check if email already exists
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const existingUser = await p.users.findUnique({
          where: { email: autoEmail }
        }).catch(() => null)

        if (existingUser) {
          // Email already exists, suggest a variation
          const timestamp = Date.now().toString().slice(-4)
          const alternativeEmail = generateAutoEmail(firstName.trim(), lastName.trim()) + timestamp
          throw Errors.validation(`An account with email ${autoEmail} already exists. Please contact administrator.`)
        }
      }

      logger.info('Auto email generated', { firstName, lastName, autoEmail })

      return successResponse({
        email: autoEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        message: 'Email generated successfully'
      })
    }

    // Step 2: Complete registration with password
    if (step === 'complete') {
      if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
        throw Errors.validation('All fields are required')
      }

      // Validate passwords match
      if (password !== confirmPassword) {
        throw Errors.validation('Passwords do not match. Please ensure both passwords are identical.')
      }

      // Validate password strength
      if (password.length < 8) {
        throw Errors.validation('Password must be at least 8 characters')
      }

      const hasUppercase = /[A-Z]/.test(password)
      const hasLowercase = /[a-z]/.test(password)
      const hasNumber = /[0-9]/.test(password)

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        throw Errors.validation('Password must contain uppercase, lowercase, and number')
      }

      // Validate role
      const allowedRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER', 'ADMIN']
      if (!allowedRoles.includes(role)) {
        throw Errors.validation('Invalid role selected')
      }

      // Test database connection
      const dbTest = await testConnection()
      if (!dbTest.success) {
        throw Errors.database('Database connection failed. Please try again later.')
      }

      const prisma = await getPrisma()
      if (!prisma) {
        throw Errors.database('Database client unavailable')
      }

      const p = prisma as any

      // Check if email already exists
      const existingUser = await p.users.findUnique({
        where: { email: email.toLowerCase() }
      }).catch(() => null)

      if (existingUser) {
        throw Errors.validation('An account with this email already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Generate initials
      const userInitials = generateInitials(firstName, lastName)

      // Generate full name
      const fullName = `${firstName.trim()} ${lastName.trim()}`

      // Create user with PENDING approval status
      const newUser = await p.users.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: email.toLowerCase(),
          name: fullName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password: hashedPassword,
          role,
          department: department || null,
          initials: userInitials,
          phone: phone || null,
          isActive: true,
          isFirstLogin: false,
          approvalStatus: 'PENDING',
          createdAt: new Date()
        }
      }).catch((err: Error) => {
        logger.error('Error creating user', { error: err.message })
        throw Errors.database('Failed to create user account')
      })

      logger.info('User registered, pending approval', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      })

      // Create notification for admins/superadmins
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'user_registration',
            title: 'New User Registration',
            message: `${fullName} has registered as ${role} and is awaiting approval.`,
            targetRoles: ['SUPER_ADMIN', 'ADMIN'],
            data: {
              userId: newUser.id,
              userEmail: newUser.email,
              userName: fullName,
              userRole: role
            },
            priority: 'high'
          })
        })
      } catch (notifError) {
        logger.warn('Failed to send notification', { error: String(notifError) })
      }

      return successResponse({
        message: 'Registration submitted successfully! An administrator will review your application. You will be able to login once approved.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          approvalStatus: newUser.approvalStatus
        },
        requiresApproval: true
      })
    }

    throw Errors.validation('Invalid step')

  } catch (error) {
    return errorResponse(error, { module: 'Signup', operation: 'register' })
  }
}
