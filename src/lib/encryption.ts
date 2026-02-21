/**
 * Data Encryption Utility for RUN Health Centre HMS
 * AES-256 encryption for sensitive patient data
 * Ensures data protection even if database is compromised
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto'

/**
 * Encryption configuration
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

/**
 * Get encryption key from environment or generate a default
 * In production, ALWAYS use environment variable
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY
  
  if (envKey) {
    // Use environment key directly if it's 32 bytes
    if (Buffer.byteLength(envKey, 'utf8') === 32) {
      return Buffer.from(envKey, 'utf8')
    }
    // Derive key from environment variable
    return createHash('sha256').update(envKey).digest()
  }
  
  // Development fallback - NOT for production
  console.warn('[ENCRYPTION] Using development encryption key - SET ENCRYPTION_KEY in production!')
  const devKey = 'run-hms-dev-encryption-key-do-not-use-in-production'
  return createHash('sha256').update(devKey).digest()
}

/**
 * Derive a key from password and salt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32)
}

/**
 * Encrypt a string value
 * Returns encrypted string in format: salt:iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  
  try {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const salt = randomBytes(SALT_LENGTH)
    
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Format: salt:iv:authTag:encrypted
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted
    ].join(':')
    
  } catch (error) {
    console.error('[ENCRYPTION] Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  
  try {
    const key = getEncryptionKey()
    const parts = ciphertext.split(':')
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }
    
    const [saltHex, ivHex, authTagHex, encrypted] = parts
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
    
  } catch (error) {
    console.error('[ENCRYPTION] Decryption failed:', error)
    throw new Error('Failed to decrypt data - data may be corrupted or tampered')
  }
}

/**
 * Encrypt a JSON object
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt a JSON object
 */
export function decryptObject<T extends Record<string, unknown>>(ciphertext: string): T {
  const decrypted = decrypt(ciphertext)
  return JSON.parse(decrypted) as T
}

/**
 * Check if a string is encrypted
 * Returns true if it matches our encrypted format
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  
  const parts = value.split(':')
  if (parts.length !== 4) return false
  
  const [saltHex, ivHex, authTagHex, encrypted] = parts
  
  // Check if all parts are valid hex strings with correct lengths
  const saltRegex = /^[0-9a-f]{64}$/i  // 32 bytes = 64 hex chars
  const ivRegex = /^[0-9a-f]{32}$/i    // 16 bytes = 32 hex chars
  const authTagRegex = /^[0-9a-f]{32}$/i // 16 bytes = 32 hex chars
  const encryptedRegex = /^[0-9a-f]+$/i  // Variable length
  
  return saltRegex.test(saltHex) && 
         ivRegex.test(ivHex) && 
         authTagRegex.test(authTagHex) && 
         encryptedRegex.test(encrypted)
}

/**
 * Hash a value (one-way encryption)
 * Use for values that never need to be retrieved
 */
export function hashValue(value: string): string {
  return createHash('sha256')
    .update(value + (process.env.HASH_SALT || 'run-hms-hash-salt'))
    .digest('hex')
}

/**
 * Compare a value with its hash
 */
export function compareHash(value: string, hashedValue: string): boolean {
  return hashValue(value) === hashedValue
}

/**
 * Field-level encryption for sensitive patient data
 * Automatically encrypts specified fields
 */

/**
 * Sensitive fields that should be encrypted
 */
const SENSITIVE_PATIENT_FIELDS = [
  'firstName',
  'lastName',
  'middleName',
  'phone',
  'email',
  'address',
  'emergencyContact',
  'emergencyPhone'
]

const SENSITIVE_MEDICAL_FIELDS = [
  'diagnosis',
  'presentIllness',
  'pastHistory',
  'treatment',
  'chiefComplaint'
]

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = SENSITIVE_PATIENT_FIELDS
): T {
  const encrypted = { ...obj }
  
  for (const field of fields) {
    if (field in encrypted && typeof encrypted[field] === 'string') {
      const value = encrypted[field] as string
      if (value && !isEncrypted(value)) {
        encrypted[field] = encrypt(value) as T[keyof T]
      }
    }
  }
  
  return encrypted
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = SENSITIVE_PATIENT_FIELDS
): T {
  const decrypted = { ...obj }
  
  for (const field of fields) {
    if (field in decrypted && typeof decrypted[field] === 'string') {
      const value = decrypted[field] as string
      if (value && isEncrypted(value)) {
        try {
          decrypted[field] = decrypt(value) as T[keyof T]
        } catch (error) {
          // If decryption fails, keep original value (might not be encrypted)
          console.warn(`[ENCRYPTION] Failed to decrypt field ${field}`)
        }
      }
    }
  }
  
  return decrypted
}

/**
 * Encrypt patient data for storage
 */
export function encryptPatientData(patient: {
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
}): Record<string, unknown> {
  return encryptFields(patient, SENSITIVE_PATIENT_FIELDS)
}

/**
 * Decrypt patient data for display
 */
export function decryptPatientData(patient: Record<string, unknown>): Record<string, unknown> {
  return decryptFields(patient, SENSITIVE_PATIENT_FIELDS)
}

/**
 * Encrypt medical record data
 */
export function encryptMedicalRecord(record: {
  diagnosis?: string
  presentIllness?: string
  pastHistory?: string
  treatment?: string
  chiefComplaint?: string
}): Record<string, unknown> {
  return encryptFields(record, SENSITIVE_MEDICAL_FIELDS)
}

/**
 * Decrypt medical record data
 */
export function decryptMedicalRecord(record: Record<string, unknown>): Record<string, unknown> {
  return decryptFields(record, SENSITIVE_MEDICAL_FIELDS)
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Mask sensitive data for display
 * Shows only last N characters
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '****'
  }
  
  const visible = value.slice(-visibleChars)
  const masked = '*'.repeat(Math.min(value.length - visibleChars, 10))
  
  return masked + visible
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@****.com'
  
  const [localPart, domain] = email.split('@')
  const [domainName, tld] = domain.split('.')
  
  const maskedLocal = localPart.charAt(0) + '***' + localPart.slice(-1)
  const maskedDomain = domainName.charAt(0) + '***'
  
  return `${maskedLocal}@${maskedDomain}.${tld}`
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
  if (!phone) return '****-****-****'
  
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return '****-****-****'
  
  const visible = digits.slice(-4)
  return `***-***-${visible}`
}

/**
 * Create a searchable hash for encrypted fields
 * Allows searching without decrypting all records
 */
export function createSearchHash(value: string): string {
  // Normalize the value (lowercase, trim)
  const normalized = value.toLowerCase().trim()
  return hashValue(normalized)
}

/**
 * Rotate encryption key (re-encrypt with new key)
 * This is a batch operation that should be done carefully
 */
export async function rotateEncryptionKey(
  oldKey: string,
  newKey: string,
  data: string[]
): Promise<string[]> {
  const oldKeyBuffer = createHash('sha256').update(oldKey).digest()
  const newKeyBuffer = createHash('sha256').update(newKey).digest()
  
  return data.map(ciphertext => {
    try {
      const parts = ciphertext.split(':')
      if (parts.length !== 4) return ciphertext
      
      const [, ivHex, authTagHex, encrypted] = parts
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      
      // Decrypt with old key
      const oldDecipher = createDecipheriv(ALGORITHM, oldKeyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH })
      oldDecipher.setAuthTag(authTag)
      let decrypted = oldDecipher.update(encrypted, 'hex', 'utf8')
      decrypted += oldDecipher.final('utf8')
      
      // Re-encrypt with new key
      const newIv = randomBytes(IV_LENGTH)
      const newSalt = randomBytes(SALT_LENGTH)
      const newCipher = createCipheriv(ALGORITHM, newKeyBuffer, newIv, { authTagLength: AUTH_TAG_LENGTH })
      
      let newEncrypted = newCipher.update(decrypted, 'utf8', 'hex')
      newEncrypted += newCipher.final('hex')
      const newAuthTag = newCipher.getAuthTag()
      
      return [
        newSalt.toString('hex'),
        newIv.toString('hex'),
        newAuthTag.toString('hex'),
        newEncrypted
      ].join(':')
      
    } catch (error) {
      console.error('[ENCRYPTION] Key rotation failed for item:', error)
      return ciphertext // Return original if rotation fails
    }
  })
}

/**
 * Encryption status check
 */
export function getEncryptionStatus(): {
  isConfigured: boolean
  algorithm: string
  keySource: 'environment' | 'fallback'
  warning?: string
} {
  const hasEnvKey = !!process.env.ENCRYPTION_KEY
  
  return {
    isConfigured: hasEnvKey,
    algorithm: ALGORITHM,
    keySource: hasEnvKey ? 'environment' : 'fallback',
    warning: hasEnvKey ? undefined : 'WARNING: Using development encryption key. Set ENCRYPTION_KEY environment variable for production.'
  }
}

// Export sensitive field lists for use elsewhere
export { SENSITIVE_PATIENT_FIELDS, SENSITIVE_MEDICAL_FIELDS }
