/**
 * Session Fingerprint API
 * Collects client-side fingerprint data and validates sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createFingerprint, 
  verifyFingerprint,
  getFingerprint 
} from '@/lib/session-fingerprint'
import { createAuditLog } from '@/lib/audit-logger'

/**
 * POST: Create or update session fingerprint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      sessionId,
      userId,
      timezone,
      language,
      screenResolution,
      colorDepth,
      deviceMemory,
      cpuCores,
      platform,
      touchSupport,
      webglRenderer
    } = body
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'Unknown'
    
    // Check if fingerprint already exists
    const existing = getFingerprint(sessionId)
    
    if (existing) {
      // Verify existing fingerprint
      const verification = verifyFingerprint({
        sessionId,
        userAgent,
        ipAddress,
        clientData: {
          timezone,
          language,
          screenResolution
        }
      })
      
      if (!verification.isValid || verification.recommendedAction === 'terminate') {
        // Log security event
        await createAuditLog({
          userId: existing.userId,
          action: 'SUSPICIOUS_ACTIVITY',
          entity: 'SESSION',
          entityId: sessionId,
          details: `Fingerprint verification failed: ${verification.mismatches.join(', ')}`,
          ipAddress,
          userAgent,
          success: false
        })
        
        return NextResponse.json({
          success: false,
          action: 'terminate',
          reason: 'Session verification failed',
          mismatches: verification.mismatches
        }, { status: 401 })
      }
      
      if (verification.recommendedAction === 'challenge') {
        // Require re-authentication
        return NextResponse.json({
          success: true,
          action: 'challenge',
          reason: 'Please re-authenticate',
          confidence: verification.confidence
        })
      }
      
      if (verification.recommendedAction === 'warn') {
        // Log warning but allow
        await createAuditLog({
          userId: existing.userId,
          action: 'SUSPICIOUS_ACTIVITY',
          entity: 'SESSION',
          entityId: sessionId,
          details: `Fingerprint warning: ${verification.mismatches.join(', ')}`,
          ipAddress,
          userAgent,
          success: true
        })
        
        return NextResponse.json({
          success: true,
          action: 'warn',
          warnings: verification.mismatches,
          confidence: verification.confidence
        })
      }
      
      return NextResponse.json({
        success: true,
        action: 'allow',
        confidence: verification.confidence
      })
    }
    
    // Create new fingerprint
    if (userId) {
      const fingerprint = createFingerprint({
        userId,
        sessionId,
        userAgent,
        ipAddress,
        clientData: {
          timezone,
          language,
          screenResolution,
          colorDepth,
          deviceMemory,
          cpuCores,
          platform,
          touchSupport,
          webglRenderer
        }
      })
      
      await createAuditLog({
        userId,
        action: 'LOGIN_SUCCESS',
        entity: 'SESSION',
        entityId: sessionId,
        details: `New session fingerprint created: ${fingerprint.browserName} on ${fingerprint.osName}`,
        ipAddress,
        userAgent,
        success: true
      })
      
      return NextResponse.json({
        success: true,
        fingerprintId: fingerprint.id,
        action: 'allow'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unable to create fingerprint - missing user ID'
    }, { status: 400 })
    
  } catch (error) {
    console.error('[Fingerprint API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process fingerprint'
    }, { status: 500 })
  }
}

/**
 * GET: Get fingerprint status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    const fingerprint = getFingerprint(sessionId)
    
    if (!fingerprint) {
      return NextResponse.json({
        success: false,
        error: 'Fingerprint not found'
      }, { status: 404 })
    }
    
    // Return safe fingerprint info (no sensitive data)
    return NextResponse.json({
      success: true,
      fingerprint: {
        browserName: fingerprint.browserName,
        browserVersion: fingerprint.browserVersion,
        osName: fingerprint.osName,
        osVersion: fingerprint.osVersion,
        deviceType: fingerprint.deviceType,
        timezone: fingerprint.timezone,
        createdAt: fingerprint.createdAt,
        lastVerifiedAt: fingerprint.lastVerifiedAt,
        isValid: fingerprint.isValid
      }
    })
    
  } catch (error) {
    console.error('[Fingerprint API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get fingerprint'
    }, { status: 500 })
  }
}

/**
 * DELETE: Remove fingerprint (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    const fingerprint = getFingerprint(sessionId)
    
    if (fingerprint) {
      await createAuditLog({
        userId: fingerprint.userId,
        action: 'LOGOUT',
        entity: 'SESSION',
        entityId: sessionId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        success: true
      })
    }
    
    // Note: In production, you'd also invalidate the session in the database
    // and clear any session cookies
    
    return NextResponse.json({
      success: true,
      message: 'Session fingerprint removed'
    })
    
  } catch (error) {
    console.error('[Fingerprint API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove fingerprint'
    }, { status: 500 })
  }
}
