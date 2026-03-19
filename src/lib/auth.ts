/**
 * Authentication Utilities
 * Password hashing, verification, and security functions
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * Supports both hashed and legacy plain-text passwords
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash)
  }
  
  // Legacy support: plain text comparison (for migration)
  // This will be removed after all passwords are migrated
  return password === hash
}

/**
 * Check if a password hash needs to be rehashed
 * (e.g., if salt rounds changed or it's still plain text)
 */
export function needsRehash(hash: string): boolean {
  // If it's not a bcrypt hash, it needs rehashing
  return !(hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'))
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Validate password strength
 * Returns object with isValid and message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string; score: number } {
  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  if (checks.length) score++
  if (checks.lowercase) score++
  if (checks.uppercase) score++
  if (checks.number) score++
  if (checks.special) score++
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters', score }
  }
  
  if (score < 3) {
    return { isValid: true, message: 'Weak password - consider adding uppercase, numbers, or special characters', score }
  }
  
  if (score < 4) {
    return { isValid: true, message: 'Medium strength password', score }
  }
  
  return { isValid: true, message: 'Strong password', score }
}

/**
 * Check if password has expired (older than 90 days)
 */
export function isPasswordExpired(passwordLastChanged?: string): boolean {
  if (!passwordLastChanged) return true // Force change if no date
  
  const lastChanged = new Date(passwordLastChanged)
  const now = new Date()
  const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysSinceChange > 90
}

/**
 * Get days until password expires
 */
export function getDaysUntilExpiry(passwordLastChanged?: string): number {
  if (!passwordLastChanged) return 0
  
  const lastChanged = new Date(passwordLastChanged)
  const now = new Date()
  const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24))
  
  return Math.max(0, 90 - daysSinceChange)
}
