// Two-Factor Authentication Verification API
import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'
import { verifyTOTP, verifyBackupCode } from '@/lib/two-factor'

const logger = createLogger('2FA-Verify')

// Get prisma client
async function getPrisma() {
  try {
    const { getPrisma: getClient } = await import('@/lib/db')
    return await getClient()
  } catch (e) {
    logger.error('Failed to get Prisma client', { error: String(e) })
    return null
  }
}

// POST - Verify 2FA code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code, isBackupCode } = body
    
    if (!userId || !code) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and verification code are required' 
      }, { status: 400 })
    }
    
    const prisma = await getPrisma()
    
    // Demo mode - accept any 6-digit code
    if (!prisma) {
      if (code.length === 6 || (isBackupCode && code.length >= 8)) {
        logger.info('2FA verified in demo mode', { userId })
        return successResponse({ verified: true })
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid verification code' 
      }, { status: 400 })
    }
    
    const p = prisma as any
    
    // Get user's 2FA settings
    const user = await p.users.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorEnabled: true
      }
    })
    
    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Two-factor authentication not enabled for this user' 
      }, { status: 400 })
    }
    
    let verified = false
    
    if (isBackupCode) {
      // Verify backup code
      const backupCodes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : []
      const result = verifyBackupCode(backupCodes, code)
      
      if (result.valid) {
        verified = true
        // Update backup codes in database
        await p.users.update({
          where: { id: userId },
          data: { 
            twoFactorBackupCodes: JSON.stringify(result.remainingCodes),
            updatedAt: new Date()
          }
        })
        logger.info('2FA backup code used', { userId, codesRemaining: result.remainingCodes.length })
      }
    } else {
      // Verify TOTP code
      if (user.twoFactorSecret) {
        verified = verifyTOTP(user.twoFactorSecret, code)
      }
    }
    
    if (verified) {
      logger.info('2FA verification successful', { userId })
      return successResponse({ verified: true })
    } else {
      logger.warn('2FA verification failed', { userId, isBackupCode })
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid verification code' 
      }, { status: 400 })
    }
    
  } catch (error: any) {
    logger.error('2FA verification error', { error: error.message })
    return errorResponse(error, { module: '2FA', operation: 'verify' })
  }
}

// GET - Check 2FA status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  const prisma = await getPrisma()
  
  if (!prisma) {
    return successResponse({ 
      enabled: false,
      mode: 'demo'
    })
  }
  
  try {
    const p = prisma as any
    const user = await p.users.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    })
    
    return successResponse({ 
      enabled: user?.twoFactorEnabled || false,
      hasSecret: !!user?.twoFactorSecret
    })
  } catch (error) {
    return successResponse({ enabled: false })
  }
}
