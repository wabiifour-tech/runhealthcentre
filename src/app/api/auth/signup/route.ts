// New User Registration API - Direct pg connection (no Prisma dependency)
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Signup')

// Create a direct pool connection
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// Generate auto email from first name and last name
function generateAutoEmail(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '')
  return `${cleanFirst}${cleanLast}@ruhc`
}

// Generate initials from name
function generateInitials(firstName: string, lastName: string): string {
  return (firstName[0] + lastName[0]).toUpperCase()
}

// Create notification directly in database
async function createNotificationDirect(pool: Pool, notification: {
  type: string
  title: string
  message: string
  targetRoles: string[]
  data: any
  priority: string
}) {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    await pool.query(`
      INSERT INTO notifications (id, "targetRoles", type, title, message, data, priority, read, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)
    `, [
      id,
      JSON.stringify(notification.targetRoles),
      notification.type,
      notification.title,
      notification.message,
      JSON.stringify(notification.data),
      notification.priority,
      now
    ])
    
    logger.info('Notification created directly in database', { id, type: notification.type })
    return true
  } catch (error) {
    logger.error('Failed to create notification directly', { error: String(error) })
    return false
  }
}

// POST - Step-by-step registration
export async function POST(request: NextRequest) {
  const pool = getPool()
  
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
      const result = await pool.query('SELECT id FROM users WHERE email = $1', [autoEmail])
      if (result.rows.length > 0) {
        throw Errors.validation(`An account with email ${autoEmail} already exists. Please contact administrator.`)
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

      // Check if email already exists
      const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
      if (existingResult.rows.length > 0) {
        throw Errors.validation('An account with this email already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Generate user data
      const userInitials = generateInitials(firstName, lastName)
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create user
      await pool.query(`
        INSERT INTO users (
          id, email, name, "firstName", "lastName", password, role, 
          department, initials, phone, "isActive", "isFirstLogin", 
          "approvalStatus", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        userId,
        email.toLowerCase(),
        fullName,
        firstName.trim(),
        lastName.trim(),
        hashedPassword,
        role,
        department || null,
        userInitials,
        phone || null,
        true,
        false,
        'PENDING',
        new Date(),
        new Date()  // updatedAt
      ])

      logger.info('User registered, pending approval', { userId, email, role })

      // Create notification for admins DIRECTLY in database (more reliable than API call)
      await createNotificationDirect(pool, {
        type: 'user_registration',
        title: 'New User Registration',
        message: `${fullName} has registered as ${role} and is awaiting approval.`,
        targetRoles: ['SUPER_ADMIN', 'ADMIN'],
        data: { userId, userEmail: email, userName: fullName, userRole: role },
        priority: 'high'
      })

      return successResponse({
        message: 'Registration submitted successfully! An administrator will review your application. You will be able to login once approved.',
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: fullName,
          role,
          approvalStatus: 'PENDING'
        },
        requiresApproval: true
      })
    }

    throw Errors.validation('Invalid step')

  } catch (error) {
    logger.error('Signup error', { error: error instanceof Error ? error.message : String(error) })
    return errorResponse(error, { module: 'Signup', operation: 'register' })
  } finally {
    await pool.end()
  }
}
