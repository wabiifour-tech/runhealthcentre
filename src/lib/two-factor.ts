// Two-Factor Authentication Utilities
// Implements TOTP (Time-based One-Time Password) for 2FA

import crypto from 'crypto'

// Base32 encoding for TOTP secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export interface TwoFactorSetupData {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

export interface TwoFactorVerifyResult {
  valid: boolean
  remainingAttempts?: number
}

// Generate a random secret for TOTP
export function generateSecret(): string {
  const buffer = crypto.randomBytes(20)
  let secret = ''
  
  // Convert to Base32
  for (let i = 0; i < buffer.length; i += 5) {
    const chunk = buffer.slice(i, i + 5)
    secret += base32Encode(chunk)
  }
  
  return secret
}

// Base32 encode
function base32Encode(buffer: Buffer): string {
  let result = ''
  let bits = 0
  let value = 0
  
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  
  return result
}

// Generate QR code URL for authenticator apps
export function generateQRCodeUrl(secret: string, email: string, issuer: string = 'RUHC'): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  
  return codes
}

// Verify TOTP code
export function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  if (!secret || !code) return false
  
  // Clean the code
  const cleanCode = code.replace(/\s/g, '')
  
  if (!/^\d{6}$/.test(cleanCode)) return false
  
  const secretBuffer = base32Decode(secret)
  const currentTime = Math.floor(Date.now() / 1000 / 30)
  
  // Check current and adjacent time windows (±window steps)
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i
    const expectedCode = generateTOTP(secretBuffer, time)
    
    if (cleanCode === expectedCode) {
      return true
    }
  }
  
  return false
}

// Decode Base32
function base32Decode(encoded: string): Buffer {
  // Remove any spaces or dashes
  encoded = encoded.replace(/[\s-]/g, '').toUpperCase()
  
  const bits: number[] = []
  
  for (const char of encoded) {
    const val = BASE32_CHARS.indexOf(char)
    if (val === -1) continue
    
    bits.push((val >> 4) & 1)
    bits.push((val >> 3) & 1)
    bits.push((val >> 2) & 1)
    bits.push((val >> 1) & 1)
    bits.push(val & 1)
  }
  
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j]
    }
    bytes.push(byte)
  }
  
  return Buffer.from(bytes)
}

// Generate TOTP code
function generateTOTP(secret: Buffer, time: number): string {
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigInt64BE(BigInt(time), 0)
  
  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(timeBuffer)
  const hash = hmac.digest()
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const code = ((hash[offset] & 0x7f) << 24 |
                (hash[offset + 1] & 0xff) << 16 |
                (hash[offset + 2] & 0xff) << 8 |
                (hash[offset + 3] & 0xff)) % 1000000
  
  return code.toString().padStart(6, '0')
}

// Complete setup process
export function setupTwoFactor(email: string): TwoFactorSetupData {
  const secret = generateSecret()
  const qrCodeUrl = generateQRCodeUrl(secret, email)
  const backupCodes = generateBackupCodes()
  
  return {
    secret,
    qrCodeUrl,
    manualEntryKey: secret,
    backupCodes
  }
}

// Verify backup code
export function verifyBackupCode(backupCodes: string[], code: string): { valid: boolean; remainingCodes: string[] } {
  const upperCode = code.toUpperCase().replace(/\s/g, '')
  const index = backupCodes.findIndex(c => c.replace(/-/g, '') === upperCode)
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes }
  }
  
  const remainingCodes = [...backupCodes.slice(0, index), ...backupCodes.slice(index + 1)]
  return { valid: true, remainingCodes }
}

// Hash secret for storage
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

// Verify hashed secret
export function verifyHashedSecret(secret: string, hash: string): boolean {
  return hashSecret(secret) === hash
}
