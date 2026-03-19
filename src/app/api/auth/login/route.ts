// Authentication API - Login with PostgreSQL (Neon) Support
// Uses Direct pg as PRIMARY with Prisma as SECONDARY
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getPool, getPrisma } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('Auth')

// Demo SuperAdmin credentials (fallback when database completely unavailable)
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

// Login endpoint - PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    logger.info('Login attempt', { email: email?.toLowerCase(), rememberMe })

    if (!email || !password) {
      throw Errors.validation('Email and password are required')
    }

    const emailLower = email.toLowerCase()

    // Use singleton pool
    const pool = getPool()

    // PRIMARY: Try direct PostgreSQL first (most reliable)
    try {
      const result = await pool.query(`
        SELECT id, email, name, role, department, initials, password, 
               "isActive", "isFirstLogin", "approvalStatus", "viewablePassword"
        FROM users 
        WHERE email = $1
      `, [emailLower])

      if (result.rows.length > 0) {
        const user = result.rows[0]

        // Check if account is active
        if (!user.isActive) {
          throw Errors.forbidden('Your account has been deactivated. Please contact administrator.')
        }

        // Check approval status
        if (user.approvalStatus === 'PENDING') {
          throw Errors.forbidden('Your account is pending approval. An administrator will review your application shortly.')
        }

        if (user.approvalStatus === 'REJECTED') {
          throw Errors.forbidden('Your account application was not approved. Please contact administrator for more information.')
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password)

        if (!passwordValid) {
          throw Errors.unauthorized('Invalid email or password')
        }

        // Handle "Remember Me"
        let rememberToken: string | undefined = undefined
        const updateFields = ['"lastLogin" = $1']
        const updateValues: any[] = [new Date()]
        
        if (rememberMe) {
          rememberToken = generateRememberToken()
          const hashedToken = hashToken(rememberToken)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30) // 30 days
          
          updateFields.push('"rememberToken" = $2', '"tokenExpiresAt" = $3')
          updateValues.push(hashedToken, expiresAt)
          updateValues.push(user.id)
        } else {
          updateValues.push(user.id)
        }

        // Update last login
        try {
          await pool.query(`
            UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}
          `, updateValues)
        } catch (updateError) {
          logger.warn('Failed to update lastLogin', { error: String(updateError) })
        }

        logger.info('Login successful via direct pg', { 
          email: emailLower, 
          role: user.role,
          rememberMe: !!rememberMe
        })

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
          rememberToken: rememberToken,
          mode: 'database-direct'
        })
      }
    } catch (directError: any) {
      logger.warn('Direct pg login failed, trying Prisma', { error: directError.message })
    }

    // SECONDARY: Try Prisma as backup
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const user = await p.users.findUnique({
          where: { email: emailLower }
        })

        if (user) {
          // Check if account is active
          if (!user.isActive) {
            throw Errors.forbidden('Your account has been deactivated. Please contact administrator.')
          }

          // Check approval status
          if (user.approvalStatus === 'PENDING') {
            throw Errors.forbidden('Your account is pending approval. An administrator will review your application shortly.')
          }

          if (user.approvalStatus === 'REJECTED') {
            throw Errors.forbidden('Your account application was not approved. Please contact administrator for more information.')
          }

          // Verify password
          const passwordValid = await bcrypt.compare(password, user.password)

          if (!passwordValid) {
            throw Errors.unauthorized('Invalid email or password')
          }

          // Update last login
          try {
            await p.users.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            })
          } catch {}

          logger.info('Login successful via Prisma', { 
            email: emailLower, 
            role: user.role 
          })

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
            mode: 'database-prisma'
          })
        }
      }
    } catch (prismaError: any) {
      if (prismaError.name === 'ApiError') {
        throw prismaError
      }
      logger.warn('Prisma login also failed', { error: prismaError.message })
    }

    // FALLBACK: Demo SuperAdmin only for wabithetechnurse@ruhc
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

    throw Errors.unauthorized('Invalid email or password')

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'login' })
  }
}

// Validate remember token - PostgreSQL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return successResponse({ valid: false })
    }

    const hashedToken = hashToken(token)
    const pool = getPool()

    // PRIMARY: Direct pg
    try {
      const result = await pool.query(`
        SELECT id, email, name, role, department, initials, "isFirstLogin"
        FROM users 
        WHERE "rememberToken" = $1 
          AND "tokenExpiresAt" >= $2 
          AND "isActive" = true 
          AND "approvalStatus" = 'APPROVED'
      `, [hashedToken, new Date()])

      if (result.rows.length > 0) {
        const user = result.rows[0]
        
        logger.info('Remember token validated via direct pg', { email: user.email })
        
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
      }
    } catch (directError) {
      logger.warn('Direct pg token validation failed', { error: String(directError) })
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const user = await p.users.findFirst({
          where: {
            rememberToken: hashedToken,
            tokenExpiresAt: { gte: new Date() },
            isActive: true,
            approvalStatus: 'APPROVED'
          }
        })

        if (user) {
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
        }
      }
    } catch (prismaError) {
      logger.warn('Prisma token validation failed', { error: String(prismaError) })
    }

    return successResponse({ valid: false })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'validateToken' })
  }
}

// Logout - clear remember token - PostgreSQL
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return successResponse({ message: 'Logged out' })
    }

    const pool = getPool()

    // PRIMARY: Direct pg
    try {
      await pool.query(`
        UPDATE users SET "rememberToken" = NULL, "tokenExpiresAt" = NULL WHERE id = $1
      `, [userId])
      logger.info('Remember token cleared via direct pg', { userId })
    } catch (directError) {
      // SECONDARY: Prisma
      try {
        const prisma = await getPrisma()
        if (prisma) {
          const p = prisma as any
          await p.users.update({
            where: { id: userId },
            data: {
              rememberToken: null,
              tokenExpiresAt: null
            }
          })
        }
      } catch {}
    }

    return successResponse({ message: 'Logged out successfully' })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'logout' })
  }
}

// Get all users (for admin) - PostgreSQL
export async function PUT() {
  try {
    const pool = getPool()
    
    // PRIMARY: Direct pg
    try {
      const result = await pool.query(`
        SELECT id, email, name, "firstName", "lastName", role, department, initials, 
               "isActive", "approvalStatus", "approvedBy", "approvedAt"::text, 
               "lastLogin"::text, "createdAt"::text, phone
        FROM users 
        ORDER BY "createdAt" DESC
      `)

      const users = result.rows
      const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length

      logger.info('Users fetched via direct pg', { count: users.length, pendingCount })
      
      return successResponse({
        users,
        pendingCount,
        mode: 'database-direct'
      })
    } catch (directError) {
      logger.warn('Direct pg users fetch failed, trying Prisma', { error: String(directError) })
    }

    // SECONDARY: Prisma
    try {
      const prisma = await getPrisma()
      if (prisma) {
        const p = prisma as any
        const users = await p.users.findMany({
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

        const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length
        
        return successResponse({
          users,
          pendingCount,
          mode: 'database-prisma'
        })
      }
    } catch (prismaError) {
      logger.warn('Prisma users fetch also failed', { error: String(prismaError) })
    }

    // FALLBACK: Return demo admin only
    return successResponse({ 
      users: [DEMO_SUPERADMIN],
      pendingCount: 0,
      mode: 'demo'
    })

  } catch (error) {
    return errorResponse(error, { module: 'Auth', operation: 'getUsers' })
  }
}
