/**
 * Rate Limiter Utility
 * Tracks and limits login attempts to prevent brute force attacks
 */

interface LoginAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  blockedUntil?: number
}

// In-memory store for rate limiting (use Redis in production)
const loginAttempts = new Map<string, LoginAttempt>()

// Configuration
const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Clean up expired entries from the rate limiter
 */
function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.blockedUntil && attempt.blockedUntil < now) {
      loginAttempts.delete(key)
    } else if (attempt.lastAttempt < now - ATTEMPT_WINDOW_MS) {
      loginAttempts.delete(key)
    }
  }
}

/**
 * Get rate limit status for an identifier (IP or email)
 */
export function getRateLimitStatus(identifier: string): {
  isBlocked: boolean
  remainingAttempts: number
  blockedUntil?: Date
  resetAt?: Date
} {
  cleanupExpired()
  
  const attempt = loginAttempts.get(identifier)
  const now = Date.now()
  
  if (!attempt) {
    return {
      isBlocked: false,
      remainingAttempts: MAX_ATTEMPTS
    }
  }
  
  // Check if currently blocked
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    return {
      isBlocked: true,
      remainingAttempts: 0,
      blockedUntil: new Date(attempt.blockedUntil)
    }
  }
  
  // Check if attempts are outside the window
  if (attempt.lastAttempt < now - ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier)
    return {
      isBlocked: false,
      remainingAttempts: MAX_ATTEMPTS
    }
  }
  
  return {
    isBlocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempt.count),
    resetAt: new Date(attempt.firstAttempt + ATTEMPT_WINDOW_MS)
  }
}

/**
 * Record a failed login attempt
 * Returns the updated status
 */
export function recordFailedAttempt(identifier: string): {
  isBlocked: boolean
  remainingAttempts: number
  blockedUntil?: Date
} {
  cleanupExpired()
  
  const now = Date.now()
  const existing = loginAttempts.get(identifier)
  
  let attempt: LoginAttempt
  
  if (!existing || existing.lastAttempt < now - ATTEMPT_WINDOW_MS) {
    // Start fresh
    attempt = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    }
  } else {
    // Increment existing
    attempt = {
      ...existing,
      count: existing.count + 1,
      lastAttempt: now
    }
  }
  
  // Check if should block
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION_MS
  }
  
  loginAttempts.set(identifier, attempt)
  
  const status = getRateLimitStatus(identifier)
  return {
    isBlocked: status.isBlocked,
    remainingAttempts: status.remainingAttempts,
    blockedUntil: status.blockedUntil
  }
}

/**
 * Clear rate limit for an identifier (after successful login)
 */
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier)
}

/**
 * Get formatted remaining time for blocked users
 */
export function formatRemainingTime(blockedUntil: Date): string {
  const now = new Date()
  const diffMs = blockedUntil.getTime() - now.getTime()
  
  if (diffMs <= 0) return '0 minutes'
  
  const minutes = Math.ceil(diffMs / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
}

/**
 * Middleware helper to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}

/**
 * Combined check for both IP and email rate limiting
 */
export function checkLoginRateLimit(ip: string, email: string): {
  allowed: boolean
  message?: string
  remainingAttempts?: number
  blockedUntil?: Date
} {
  const ipStatus = getRateLimitStatus(ip)
  const emailStatus = getRateLimitStatus(email)
  
  // If either is blocked, return blocked status
  if (ipStatus.isBlocked) {
    return {
      allowed: false,
      message: `Too many login attempts from this IP. Try again in ${formatRemainingTime(ipStatus.blockedUntil!)}`,
      blockedUntil: ipStatus.blockedUntil
    }
  }
  
  if (emailStatus.isBlocked) {
    return {
      allowed: false,
      message: `Too many failed login attempts for this account. Try again in ${formatRemainingTime(emailStatus.blockedUntil!)}`,
      remainingAttempts: 0,
      blockedUntil: emailStatus.blockedUntil
    }
  }
  
  // Return the more restrictive remaining attempts
  const remainingAttempts = Math.min(ipStatus.remainingAttempts, emailStatus.remainingAttempts)
  
  return {
    allowed: true,
    remainingAttempts
  }
}

/**
 * Record failed attempt for both IP and email
 */
export function recordLoginFailure(ip: string, email: string): {
  isBlocked: boolean
  remainingAttempts: number
  blockedUntil?: Date
  message: string
} {
  const ipResult = recordFailedAttempt(ip)
  const emailResult = recordFailedAttempt(email)
  
  // Return the more restrictive result
  if (ipResult.isBlocked) {
    return {
      isBlocked: true,
      remainingAttempts: 0,
      blockedUntil: ipResult.blockedUntil,
      message: `Too many login attempts from this IP. Try again in ${formatRemainingTime(ipResult.blockedUntil!)}`
    }
  }
  
  if (emailResult.isBlocked) {
    return {
      isBlocked: true,
      remainingAttempts: 0,
      blockedUntil: emailResult.blockedUntil,
      message: `Too many failed login attempts. Try again in ${formatRemainingTime(emailResult.blockedUntil!)}`
    }
  }
  
  const remainingAttempts = Math.min(ipResult.remainingAttempts, emailResult.remainingAttempts)
  
  return {
    isBlocked: false,
    remainingAttempts,
    message: remainingAttempts <= 2 
      ? `Warning: ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before lockout`
      : ''
  }
}
