// Authentication API - Login with Database Support
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

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

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('[Login] Login request for:', email)

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Try database first
    const prisma = await getDatabaseClient()

    if (prisma) {
      try {
        const p = prisma as any
        const user = await p.user.findUnique({
          where: { email: emailLower }
        })

        console.log('[Login] Database user found:', user ? user.email : 'not found')

        if (user) {
          // Check if account is active
          if (!user.isActive) {
            return NextResponse.json({ 
              success: false, 
              error: 'Your account has been deactivated. Please contact administrator.' 
            }, { status: 403 })
          }

          // Check approval status
          if (user.approvalStatus === 'PENDING') {
            return NextResponse.json({ 
              success: false, 
              error: 'Your account is pending approval. An administrator will review your application shortly.' 
            }, { status: 403 })
          }

          if (user.approvalStatus === 'REJECTED') {
            return NextResponse.json({ 
              success: false, 
              error: 'Your account application was not approved. Please contact administrator for more information.' 
            }, { status: 403 })
          }

          // Verify password
          const passwordValid = await bcrypt.compare(password, user.password)

          if (!passwordValid) {
            return NextResponse.json({ 
              success: false, 
              error: 'Invalid email or password' 
            }, { status: 401 })
          }

          // Update last login
          try {
            await p.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date().toISOString() }
            })
          } catch (e) {
            // Ignore update errors
          }

          console.log('[Login] Login successful for:', user.email)

          // Return user data
          return NextResponse.json({ 
            success: true, 
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
        console.log('[Login] Database query error:', dbError.message)
      }
    }

    // Fallback to demo SuperAdmin (only for wabithetechnurse@ruhc)
    if (emailLower === DEMO_SUPERADMIN.email) {
      const passwordValid = await bcrypt.compare(password, DEMO_SUPERADMIN.password)
      
      if (passwordValid) {
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
            isFirstLogin: DEMO_SUPERADMIN.isFirstLogin
          },
          mode: 'demo'
        })
      }
    }

    // Invalid credentials
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid email or password' 
    }, { status: 401 })

  } catch (error: any) {
    console.error('[Login] Login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred during login' 
    }, { status: 500 })
  }
}

// Get all users (for admin)
export async function GET() {
  try {
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
        lastLogin: true,
        createdAt: true,
        phone: true
      },
      orderBy: { createdAt: 'desc' }
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
