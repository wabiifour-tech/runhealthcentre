// Password Change API - For first login and password updates
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Password validation
function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return { 
      isValid: false, 
      message: 'Password must contain uppercase, lowercase, number, and special character' 
    }
  }
  
  return { isValid: true, message: 'Password is valid' }
}

// Get database client
async function getDatabaseClient() {
  try {
    const dbModule = await import('@/lib/db')
    const client = dbModule.default || dbModule.getPrisma?.()
    
    if (client) {
      try {
        const p = client as any
        await p.$queryRaw`SELECT 1`
        return client
      } catch (e) {
        return null
      }
    }
    return null
  } catch (e) {
    return null
  }
}

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword, confirmPassword, sessionId } = body

    if (!userId || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and new password are required' 
      }, { status: 400 })
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.message 
      }, { status: 400 })
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Passwords do not match' 
      }, { status: 400 })
    }

    const prisma = await getDatabaseClient()

    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database unavailable' 
      }, { status: 503 })
    }

    const p = prisma as any

    // Get user
    const user = await p.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // If this is NOT the first login or must change password, verify current password
    if (!user.mustChangePassword && !user.isFirstLogin && currentPassword) {
      const passwordValid = await bcrypt.compare(currentPassword, user.password)
      if (!passwordValid) {
        return NextResponse.json({ 
          success: false, 
          error: 'Current password is incorrect' 
        }, { status: 401 })
      }
    }

    // Check that new password is different from current
    const samePassword = await bcrypt.compare(newPassword, user.password)
    if (samePassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'New password must be different from your current password' 
      }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user
    await p.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        isFirstLogin: false,
        passwordLastChanged: new Date(),
        updatedAt: new Date()
      }
    })

    // End all other sessions except current
    if (sessionId) {
      try {
        await p.userSession.updateMany({
          where: { 
            userId: userId, 
            isActive: true,
            sessionId: { not: sessionId }
          },
          data: { 
            isActive: false, 
            endedAt: new Date() 
          }
        })
      } catch (e) {
        // Table may not exist
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully'
    })

  } catch (error: any) {
    console.error('Password change error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to change password' 
    }, { status: 500 })
  }
}
