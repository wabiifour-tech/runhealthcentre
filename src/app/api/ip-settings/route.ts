import { NextRequest, NextResponse } from 'next/server'
import { isIPAllowed, getIPLocation, getClientIP } from '@/lib/ip-utils'

// IP Settings interface
interface IPSettings {
  adminIPWhitelist: string[]
  enableNigeriaOnly: boolean
  enableFailedLoginBlock: boolean
  maxFailedAttempts: number
  blockDurationMinutes: number
  logAllAccess: boolean
}

// In-memory settings (in production, use database)
let ipSettings: IPSettings = {
  adminIPWhitelist: [], // Empty = all IPs allowed
  enableNigeriaOnly: false,
  enableFailedLoginBlock: true,
  maxFailedAttempts: 5,
  blockDurationMinutes: 30,
  logAllAccess: true,
}

// Failed login tracking
interface FailedAttempt {
  ip: string
  count: number
  firstAttempt: Date
  lastAttempt: Date
  blockedUntil?: Date
}

let failedAttempts: Map<string, FailedAttempt> = new Map()

// Get IP settings
export function getIPSettings(): IPSettings {
  return ipSettings
}

// Update IP settings
export function updateIPSettings(newSettings: Partial<IPSettings>): IPSettings {
  ipSettings = { ...ipSettings, ...newSettings }
  return ipSettings
}

// Check if IP is blocked due to failed attempts
export function isIPBlocked(ip: string): { blocked: boolean; reason?: string; remainingMinutes?: number } {
  const settings = getIPSettings()
  
  if (!settings.enableFailedLoginBlock) {
    return { blocked: false }
  }
  
  const attempt = failedAttempts.get(ip)
  if (!attempt) {
    return { blocked: false }
  }
  
  // Check if block has expired
  if (attempt.blockedUntil && new Date() > attempt.blockedUntil) {
    failedAttempts.delete(ip)
    return { blocked: false }
  }
  
  if (attempt.blockedUntil) {
    const remaining = Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 60000)
    return {
      blocked: true,
      reason: `Too many failed login attempts`,
      remainingMinutes: remaining
    }
  }
  
  return { blocked: false }
}

// Record failed login attempt
export function recordFailedAttempt(ip: string): { blocked: boolean; attemptsRemaining: number } {
  const settings = getIPSettings()
  
  const existing = failedAttempts.get(ip)
  const now = new Date()
  
  if (existing) {
    existing.count++
    existing.lastAttempt = now
    
    if (existing.count >= settings.maxFailedAttempts) {
      existing.blockedUntil = new Date(now.getTime() + settings.blockDurationMinutes * 60000)
      return { blocked: true, attemptsRemaining: 0 }
    }
    
    return { blocked: false, attemptsRemaining: settings.maxFailedAttempts - existing.count }
  }
  
  failedAttempts.set(ip, {
    ip,
    count: 1,
    firstAttempt: now,
    lastAttempt: now,
  })
  
  return { blocked: false, attemptsRemaining: settings.maxFailedAttempts - 1 }
}

// Clear failed attempts for an IP (after successful login)
export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip)
}

// Check admin IP access
export async function checkAdminAccess(ip: string, userRole: string): Promise<{ allowed: boolean; reason?: string }> {
  const settings = getIPSettings()
  
  // Only check for admin roles
  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
    return { allowed: true }
  }
  
  // Check if Nigeria-only mode is enabled
  if (settings.enableNigeriaOnly) {
    const location = await getIPLocation(ip)
    if (location && location.countryCode !== 'NG' && location.countryCode !== 'LOCAL') {
      return { allowed: false, reason: 'Access restricted to Nigeria only' }
    }
  }
  
  // Check whitelist
  if (settings.adminIPWhitelist.length > 0) {
    if (!isIPAllowed(ip, settings.adminIPWhitelist)) {
      return { allowed: false, reason: 'IP address not in whitelist' }
    }
  }
  
  return { allowed: true }
}

// GET endpoint - retrieve settings
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  return NextResponse.json({
    success: true,
    settings: ipSettings,
    currentIP: clientIP,
    blockedIPs: Array.from(failedAttempts.values())
      .filter(a => a.blockedUntil && new Date() < a.blockedUntil)
      .map(a => ({
        ip: a.ip,
        blockedUntil: a.blockedUntil,
        attempts: a.count
      }))
  })
}

// POST endpoint - update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate IP addresses in whitelist
    if (body.adminIPWhitelist) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^(\d{1,3}\.){3}\*(\/\d{1,2})?$/
      const invalidIPs = body.adminIPWhitelist.filter((ip: string) => !ipPattern.test(ip.replace('*', '0')))
      
      if (invalidIPs.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Invalid IP addresses: ${invalidIPs.join(', ')}`
        }, { status: 400 })
      }
    }
    
    updateIPSettings(body)
    
    return NextResponse.json({
      success: true,
      settings: ipSettings,
      message: 'IP settings updated successfully'
    })
  } catch (error) {
    console.error('IP settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
}

// DELETE endpoint - clear blocked IPs
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ipToUnblock = searchParams.get('ip')
  
  if (ipToUnblock) {
    failedAttempts.delete(ipToUnblock)
    return NextResponse.json({
      success: true,
      message: `IP ${ipToUnblock} unblocked`
    })
  }
  
  // Clear all
  const count = failedAttempts.size
  failedAttempts.clear()
  
  return NextResponse.json({
    success: true,
    message: `Cleared ${count} blocked IPs`
  })
}
