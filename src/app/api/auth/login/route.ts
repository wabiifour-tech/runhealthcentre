// Authentication API - Login with Database Support
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    logger.debug('Login attempt', { email: email?.toLowerCase() })

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

            // Update last login
            try {
              await p.users.update({
                where: { id: user.id },
                data: { lastLogin: new Date().toISOString() }
              })
            } catch {
              // Ignore update errors
            }

            logger.info('Login successful', { 
              email: emailLower, 
              role: user.role,
              mode: 'database' 
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

// Get all users (for admin)
export async function GET() {
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
          role: true,
          department: true,
          initials: true,
          isActive: true,
          approvalStatus: true,
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
