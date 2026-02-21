/**
 * Authentication API - Login with Enhanced Security
 * Includes: Input Sanitization, Audit Logging, Session Fingerprinting
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sanitizeEmail, sanitizeInput, validateAndSanitize, validateRequestBody } from '@/lib/input-sanitizer'
import { logAuthEvent, createAuditLog } from '@/lib/audit-logger'
import { createFingerprint, parseUserAgent } from '@/lib/session-fingerprint'

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
  approvalStatus: 'APPROVED',
  mustChangePassword: false
}

// Check if database is available
async function getDatabaseClient() {
  try {
    const dbModule = await import('@/lib/db')
    const client = dbModule.default || dbModule.getPrisma?.()
    
    if (client) {
      try {
        const p = client as any
        await p.$queryRaw`SELECT 1`
        console.log('[Login] Database connection verified')
        return client
      } catch (e) {
        console.log('[Login] Database test query failed')
        return null
      }
    }
    return null
  } catch (e) {
    console.log('[Login] Database module import failed')
    return null
  }
}

// Generate session ID
function generateSessionId(): string {
  return randomUUID()
}

// Login endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get client info early for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      request.headers.get('x-real-ip') || 
                      'Unknown'
    
    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request body' 
      }, { status: 400 })
    }
    
    const { email, password } = body
    
    // Validate and sanitize input
    const validation = validateRequestBody(
      { email, password },
      {
        email: { type: 'email', required: true },
        password: { type: 'text', required: true }
      }
    )
    
    // Check for blocked fields (injection attempts)
    if (validation.blockedFields.length > 0) {
      // Log security event
      await createAuditLog({
        action: 'INJECTION_ATTEMPT',
        entity: 'SESSION',
        details: `Blocked fields: ${validation.blockedFields.join(', ')}. Errors: ${validation.errors.join('; ')}`,
        ipAddress,
        userAgent,
        success: false
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid input detected' 
      }, { status: 400 })
    }
    
    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)
    
    if (!sanitizedEmail || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 })
    }
    
    console.log('[Login] Login request for:', sanitizedEmail)
    
    // Try database first
    const prisma = await getDatabaseClient()
    
    if (prisma) {
      try {
        const p = prisma as any
        const user = await p.user.findUnique({
          where: { email: sanitizedEmail }
        })
        
        console.log('[Login] Database user found:', user ? user.email : 'not found')
        
        if (user) {
          // Check if account is active
          if (!user.isActive) {
            await logAuthEvent('LOGIN_FAILED', {
              userId: user.id,
              userEmail: user.email,
              userRole: user.role,
              ipAddress,
              userAgent,
              success: false,
              errorMessage: 'Account deactivated'
            })
            
            return NextResponse.json({ 
              success: false, 
              error: 'Your account has been deactivated. Please contact administrator.' 
            }, { status: 403 })
          }
          
          // Check approval status
          if (user.approvalStatus === 'PENDING') {
            await logAuthEvent('LOGIN_FAILED', {
              userId: user.id,
              userEmail: user.email,
              ipAddress,
              userAgent,
              success: false,
              errorMessage: 'Account pending approval'
            })
            
            return NextResponse.json({ 
              success: false, 
              error: 'Your account is pending approval. An administrator will review your application shortly.' 
            }, { status: 403 })
          }
          
          if (user.approvalStatus === 'REJECTED') {
            await logAuthEvent('LOGIN_FAILED', {
              userId: user.id,
              userEmail: user.email,
              ipAddress,
              userAgent,
              success: false,
              errorMessage: 'Account rejected'
            })
            
            return NextResponse.json({ 
              success: false, 
              error: 'Your account application was not approved. Please contact administrator for more information.' 
            }, { status: 403 })
          }
          
          // Verify password
          const passwordValid = await bcrypt.compare(password, user.password)
          
          if (!passwordValid) {
            await logAuthEvent('LOGIN_FAILED', {
              userId: user.id,
              userEmail: user.email,
              ipAddress,
              userAgent,
              success: false,
              errorMessage: 'Invalid password'
            })
            
            return NextResponse.json({ 
              success: false, 
              error: 'Invalid email or password' 
            }, { status: 401 })
          }
          
          // Generate new session ID
          const sessionId = generateSessionId()
          
          // End all other active sessions for this user (prevent simultaneous logins)
          try {
            await p.userSession.updateMany({
              where: { 
                userId: user.id, 
                isActive: true 
              },
              data: { 
                isActive: false, 
                endedAt: new Date() 
              }
            })
          } catch (e) {
            console.log('[Login] Could not end other sessions - table may not exist yet')
          }
          
          // Parse user agent for device info
          const deviceInfo = parseUserAgent(userAgent)
          
          // Create new session
          try {
            await p.userSession.create({
              data: {
                userId: user.id,
                sessionId: sessionId,
                deviceInfo: `${deviceInfo.browserName} ${deviceInfo.browserVersion} on ${deviceInfo.osName}`,
                ipAddress: ipAddress,
                isActive: true,
                startedAt: new Date(),
                lastActivityAt: new Date()
              }
            })
            
            // Update user with current session
            await p.user.update({
              where: { id: user.id },
              data: { 
                lastLogin: new Date(),
                currentSessionId: sessionId,
                lastSessionAt: new Date()
              }
            })
          } catch (e) {
            console.log('[Login] Could not create session - table may not exist yet')
            // Still update last login
            try {
              await p.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
              })
            } catch (updateErr) {
              // Ignore update errors
            }
          }
          
          // Create session fingerprint
          createFingerprint({
            userId: user.id,
            sessionId: sessionId,
            userAgent: userAgent,
            ipAddress: ipAddress
          })
          
          // Log successful login
          await logAuthEvent('LOGIN_SUCCESS', {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress,
            userAgent,
            sessionId: sessionId,
            success: true
          })
          
          console.log('[Login] Login successful for:', user.email)
          
          // Return user data with session info
          return NextResponse.json({ 
            success: true, 
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              department: user.department,
              initials: user.initials,
              isFirstLogin: user.isFirstLogin || false,
              mustChangePassword: user.mustChangePassword ?? user.isFirstLogin ?? false
            },
            sessionId: sessionId,
            mode: 'database',
            responseTime: Date.now() - startTime
          })
        }
      } catch (dbError: any) {
        console.log('[Login] Database query error:', dbError.message)
      }
    }
    
    // Fallback to demo SuperAdmin (only for wabithetechnurse@ruhc)
    if (sanitizedEmail === DEMO_SUPERADMIN.email) {
      const passwordValid = await bcrypt.compare(password, DEMO_SUPERADMIN.password)
      
      if (passwordValid) {
        const sessionId = generateSessionId()
        
        // Create session fingerprint
        createFingerprint({
          userId: DEMO_SUPERADMIN.id,
          sessionId: sessionId,
          userAgent: userAgent,
          ipAddress: ipAddress
        })
        
        // Log successful login
        await logAuthEvent('LOGIN_SUCCESS', {
          userId: DEMO_SUPERADMIN.id,
          userEmail: DEMO_SUPERADMIN.email,
          userRole: DEMO_SUPERADMIN.role,
          ipAddress,
          userAgent,
          sessionId: sessionId,
          success: true
        })
        
        console.log('[Login] Demo SuperAdmin login successful')
        
        return NextResponse.json({ 
          success: true, 
          user: {
            id: DEMO_SUPERADMIN.id,
            email: DEMO_SUPERADMIN.email,
            name: DEMO_SUPERADMIN.name,
            role: DEMO_SUPERADMIN.role,
            department: DEMO_SUPERADMIN.department,
            initials: DEMO_SUPERADMIN.initials,
            isFirstLogin: DEMO_SUPERADMIN.isFirstLogin,
            mustChangePassword: DEMO_SUPERADMIN.mustChangePassword
          },
          sessionId: sessionId,
          mode: 'demo',
          responseTime: Date.now() - startTime
        })
      }
      
      // Log failed demo login
      await logAuthEvent('LOGIN_FAILED', {
        userEmail: sanitizedEmail,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid password for demo account'
      })
    }
    
    // Invalid credentials
    await logAuthEvent('LOGIN_FAILED', {
      userEmail: sanitizedEmail,
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Invalid credentials'
    })
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid email or password' 
    }, { status: 401 })
    
  } catch (error: any) {
    console.error('[Login] Login error:', error)
    
    await createAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'SESSION',
      details: `Unexpected error: ${error.message}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      success: false,
      errorMessage: error.message
    })
    
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred during login' 
    }, { status: 500 })
  }
}

// Get all users (for admin)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const prisma = await getDatabaseClient()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        users: [DEMO_SUPERADMIN],
        mode: 'demo'
      })
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
        approvalStatus: true,
        isFirstLogin: true,
        mustChangePassword: true,
        lastLogin: true,
        createdAt: true,
        phone: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Log admin action
    await createAuditLog({
      userId: userId,
      action: 'SEARCH_PATIENTS',
      entity: 'USER',
      details: 'Admin viewed user list',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      success: true
    })
    
    // Count pending approvals
    const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length
    
    return NextResponse.json({ 
      success: true, 
      users,
      pendingCount,
      mode: 'database'
    })
    
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ 
      success: true, 
      users: [DEMO_SUPERADMIN],
      mode: 'demo'
    })
  }
}
