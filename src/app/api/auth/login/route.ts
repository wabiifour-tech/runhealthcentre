// Authentication API - Login with Database Support & Remember Me
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getPrisma, testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Auth')

// Demo SuperAdmin credentials (fallback when database unavailable)
const DEMO_SUPERADMIN = {
  id: 'super-admin-001',
  email: 'wabithetechnurse@ruhc',
  name: 'Wabi The Tech Nurse',
  role: 'SUPER_ADMIN',
  department: 'Administration',
  initials: 'WT',
  password: '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC', // #Abolaji7977
  isFirstLogin: false,
  isActive: true,
  approvalStatus: 'APPROVED'
}

// Generate a secure remember token
function generateRememberToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Hash the token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    logger.debug('Login attempt', { email: email?.toLowerCase(), rememberMe })

    if (!email || !password) {
      throw Errors.validation('Email and password are required')
    }

    const emailLower = email.toLowerCase()

    // Test database connection first
    const dbTest = await testConnection()
    
    if (dbTest.success) {
      logger.debug('Database connected', { details: dbTest.details })
      
      const prisma = await getPrisma()
      
      if (prisma) {
        try {
          const p = prisma as any
          
          // Try the users table
          const user = await p.users.findUnique({
            where: { email: emailLower }
          })

          if (user) {
            // Check if account is active
            if (!user.isActive) {
              logger.warn('Login blocked - account deactivated', { email: emailLower })
              throw Errors.forbidden('Your account has been deactivated. Please contact administrator.')
            }

            // Check approval status
            if (user.approvalStatus === 'PENDING') {
              logger.warn('Login blocked - pending approval', { email: emailLower })
              throw Errors.forbidden('Your account is pending approval. An administrator will review your application shortly.')
            }

            if (user.approvalStatus === 'REJECTED') {
              logger.warn('Login blocked - account rejected', { email: emailLower })
              throw Errors.forbidden('Your account application was not approved. Please contact administrator for more information.')
            }

            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password)

            if (!passwordValid) {
              logger.warn('Login failed - invalid password', { email: emailLower })
              throw Errors.unauthorized('Invalid email or password')
            }

            // Prepare update data
            const updateData: any = { lastLogin: new Date() }

            // Handle "Remember Me"
            let rememberToken = null
            if (rememberMe) {
              rememberToken = generateRememberToken()
              const hashedToken = hashToken(rememberToken)
              const expiresAt = new Date()
              expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

              updateData.rememberToken = hashedToken
              updateData.tokenExpiresAt = expiresAt

              logger.info('Remember me enabled', { email: emailLower, expiresAt })
            }

            // Update last login and remember token
            try {
              await p.users.update({
                where: { id: user.id },
                data: updateData
              })
            } catch (updateError) {
              logger.warn('Failed to update user login info', { error: String(updateError) })
            }

            logger.info('Login successful', { 
              email: emailLower, 
              role: user.role,
              mode: 'database',
              rememberMe: !!rememberMe
            })

            // Return user data
            return successResponse({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                initials: user.initials,
                isFirstLogin: user.isFirstLogin || false
              },
              rememberToken: rememberToken, // Only return raw token on creation
              mode: 'database'
            })
          }
        } catch (dbError: any) {
          // Re-throw API errors
          if (dbError.name === 'ApiError') throw dbError
          logger.error('Database query error', { error: dbError.message })
        }
      }
    } else {
      logger.warn('Database not available', { message: dbTest.message })
    }

    // Fallback to demo SuperAdmin (only for wabithetechnurse@ruhc)
    if (emailLower === DEMO_SUPERADMIN.email) {
      const passwordValid = await bcrypt.compare(password, DEMO_SUPERADMIN.password)
      
      if (passwordValid) {
        logger.info('Demo SuperAdmin login successful')
        return successResponse({ 
          user: {
            id: DEMO_SUPERADMIN.id,
            email: DEMO_SUPERADMIN.email,
            name: DEMO_SUPERADMIN.name,
            role: DEMO_SUPERADMIN.role,
            department: DEMO_SUPERADMIN.department,
            initials: DEMO_SUPERADMIN.initials,
            isFirstLogin: DEMO_SUPERADMIN.isFirstLogin
          },
          mode: 'demo'
        })
      }
    }

    // Invalid credentials
    logger.warn('Login failed - invalid credentials', { email: emailLower })
    throw Errors.unauthorized('Invalid email or password')

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'login' })
  }
}

// Validate remember token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return successResponse({ valid: false })
    }

    const hashedToken = hashToken(token)
    const prisma = await getPrisma()

    if (!prisma) {
      return successResponse({ valid: false })
    }

    const p = prisma as any

    const user = await p.users.findFirst({
      where: {
        rememberToken: hashedToken,
        tokenExpiresAt: { gte: new Date() },
        isActive: true,
        approvalStatus: 'APPROVED'
      }
    })

    if (!user) {
      return successResponse({ valid: false })
    }

    logger.info('Remember token validated', { email: user.email })

    return successResponse({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        initials: user.initials,
        isFirstLogin: user.isFirstLogin || false
      }
    })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'validateToken' })
  }
}

// Logout - clear remember token
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return successResponse({ message: 'Logged out' })
    }

    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any
      try {
        await p.users.update({
          where: { id: userId },
          data: {
            rememberToken: null,
            tokenExpiresAt: null
          }
        })
        logger.info('Remember token cleared', { userId })
      } catch {
        // Ignore errors
      }
    }

    return successResponse({ message: 'Logged out successfully' })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'logout' })
  }
}

// Get all users (for admin)
export async function PUT() {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return successResponse({ 
        users: [DEMO_SUPERADMIN],
        mode: 'demo'
      })
    }

    const p = prisma as any
    
    let users = []
    try {
      users = await p.users.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          initials: true,
          isActive: true,
          approvalStatus: true,
          approvedBy: true,
          approvedAt: true,
          lastLogin: true,
          createdAt: true,
          phone: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (e) {
      logger.warn('Could not fetch users from database', { error: String(e) })
    }

    // Count pending approvals
    const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length

    logger.debug('Users fetched', { count: users.length, pendingCount })

    return successResponse({
      users,
      pendingCount,
      mode: 'database'
    })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'getUsers' })
  }
}
