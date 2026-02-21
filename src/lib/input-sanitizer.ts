/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL Injection, and other injection attacks
 * Part of RUN Health Centre HMS Security Implementation
 */

/**
 * HTML entity encoding map for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

/**
 * Common SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|UNION|EXEC|EXECUTE)\b)/gi,
  /(--)|(\/\*)|(\*\/)/g,
  /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  /['"];\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
  /\bWAITFOR\s+DELAY\b/gi,
  /\bBENCHMARK\s*\(/gi,
  /\bSLEEP\s*\(/gi,
  /xp_cmdshell/gi,
  /CONCAT\s*\(/gi,
  /CHAR\s*\(/gi,
  /0x[0-9a-fA-F]+/g
]

/**
 * XSS attack patterns to detect
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:\s*text\/html/gi
]

/**
 * Sanitize string input for safe display (XSS prevention)
 * Encodes HTML entities to prevent script execution
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char)
}

/**
 * Strip all HTML tags from input
 * Returns plain text only
 */
export function stripHTML(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Remove all HTML tags
  let stripped = input.replace(/<[^>]*>/g, '')
  
  // Remove any remaining HTML entities back to characters
  stripped = stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
  
  return stripped
}

/**
 * Detect potential SQL injection attempts
 * Returns true if suspicious patterns found
 */
export function detectSQLInjection(input: string): { 
  detected: boolean
  patterns: string[]
  risk: 'low' | 'medium' | 'high'
} {
  if (!input || typeof input !== 'string') {
    return { detected: false, patterns: [], risk: 'low' }
  }
  
  const detectedPatterns: string[] = []
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    const matches = input.match(pattern)
    if (matches) {
      detectedPatterns.push(...matches)
    }
  }
  
  // Determine risk level
  let risk: 'low' | 'medium' | 'high' = 'low'
  const uniquePatterns = [...new Set(detectedPatterns)]
  
  if (uniquePatterns.length > 3) {
    risk = 'high'
  } else if (uniquePatterns.length > 1) {
    risk = 'medium'
  } else if (uniquePatterns.length === 1) {
    risk = 'low'
  }
  
  return {
    detected: uniquePatterns.length > 0,
    patterns: uniquePatterns,
    risk
  }
}

/**
 * Detect potential XSS attempts
 * Returns true if suspicious patterns found
 */
export function detectXSS(input: string): {
  detected: boolean
  patterns: string[]
  risk: 'low' | 'medium' | 'high'
} {
  if (!input || typeof input !== 'string') {
    return { detected: false, patterns: [], risk: 'low' }
  }
  
  const detectedPatterns: string[] = []
  
  for (const pattern of XSS_PATTERNS) {
    const matches = input.match(pattern)
    if (matches) {
      detectedPatterns.push(...matches)
    }
  }
  
  // Determine risk level
  let risk: 'low' | 'medium' | 'high' = 'low'
  const uniquePatterns = [...new Set(detectedPatterns)]
  
  if (uniquePatterns.some(p => p.toLowerCase().includes('script') || p.toLowerCase().includes('javascript'))) {
    risk = 'high'
  } else if (uniquePatterns.length > 1) {
    risk = 'medium'
  } else if (uniquePatterns.length === 1) {
    risk = 'low'
  }
  
  return {
    detected: uniquePatterns.length > 0,
    patterns: uniquePatterns,
    risk
  }
}

/**
 * Sanitize input for database queries
 * Escapes special characters for safe SQL usage
 * Note: Prefer parameterized queries over this function
 */
export function sanitizeForSQL(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
}

/**
 * Sanitize email input
 * Removes dangerous characters and validates format
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim()
  
  // Remove any characters that shouldn't be in an email
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '')
  
  return sanitized
}

/**
 * Sanitize phone number input
 * Keeps only digits, +, and common separators
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  
  // Keep digits, +, -, space, parentheses
  return phone.replace(/[^0-9+\-\s()]/g, '').trim()
}

/**
 * Sanitize patient ID format
 * Only allows alphanumeric characters and hyphens
 */
export function sanitizePatientId(id: string): string {
  if (!id || typeof id !== 'string') return ''
  
  return id.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
}

/**
 * Sanitize numeric input
 * Returns a valid number or default value
 */
export function sanitizeNumber(input: string | number, defaultValue: number = 0): number {
  if (typeof input === 'number' && !isNaN(input)) {
    return input
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? defaultValue : parsed
  }
  
  return defaultValue
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: string | number, defaultValue: number = 0): number {
  const num = sanitizeNumber(input, defaultValue)
  return Math.floor(num)
}

/**
 * Validate and sanitize file upload name
 * Prevents directory traversal and malicious file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return ''
  
  // Remove path separators and null bytes
  let sanitized = fileName
    .replace(/\//g, '')
    .replace(/\\/g, '')
    .replace(/\0/g, '')
  
  // Remove special characters except dots, hyphens, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized.slice(1)
  }
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || ''
    const name = sanitized.slice(0, -(ext.length + 1))
    sanitized = name.slice(0, 250 - ext.length) + '.' + ext
  }
  
  return sanitized
}

/**
 * Comprehensive input sanitization for all form inputs
 * Applies appropriate sanitization based on field type
 */
export function sanitizeInput(input: string, type: 'text' | 'html' | 'email' | 'phone' | 'id' | 'number' = 'text'): string {
  if (!input || typeof input !== 'string') return ''
  
  switch (type) {
    case 'email':
      return sanitizeEmail(input)
    case 'phone':
      return sanitizePhone(input)
    case 'id':
      return sanitizePatientId(input)
    case 'html':
      return sanitizeHTML(input)
    case 'text':
    default:
      // First strip any HTML, then sanitize
      return sanitizeHTML(stripHTML(input))
  }
}

/**
 * Sanitize object recursively
 * Applies text sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key
    const sanitizedKey = sanitizeHTML(key)
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[sanitizedKey] = value
    }
  }
  
  return sanitized as T
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  sanitized: string
  warnings: string[]
  blocked: boolean
  blockReason?: string
}

/**
 * Validate and sanitize input with security checks
 * Returns detailed result for logging and decision making
 */
export function validateAndSanitize(
  input: string, 
  options: {
    type?: 'text' | 'html' | 'email' | 'phone' | 'id' | 'number'
    maxLength?: number
    minLength?: number
    required?: boolean
    allowHTML?: boolean
  } = {}
): ValidationResult {
  const {
    type = 'text',
    maxLength = 10000,
    minLength = 0,
    required = false,
    allowHTML = false
  } = options
  
  const warnings: string[] = []
  let blocked = false
  let blockReason: string | undefined
  
  // Check if required
  if (required && (!input || input.trim() === '')) {
    return {
      isValid: false,
      sanitized: '',
      warnings: ['Field is required'],
      blocked: true,
      blockReason: 'required_field_empty'
    }
  }
  
  // Empty input is valid if not required
  if (!input || input.trim() === '') {
    return {
      isValid: true,
      sanitized: '',
      warnings: [],
      blocked: false
    }
  }
  
  // Check for SQL injection
  const sqlCheck = detectSQLInjection(input)
  if (sqlCheck.detected) {
    if (sqlCheck.risk === 'high') {
      blocked = true
      blockReason = 'sql_injection_detected'
    }
    warnings.push(`Potential SQL injection detected (${sqlCheck.risk} risk): ${sqlCheck.patterns.join(', ')}`)
  }
  
  // Check for XSS
  const xssCheck = detectXSS(input)
  if (xssCheck.detected) {
    if (xssCheck.risk === 'high') {
      blocked = true
      blockReason = blockReason || 'xss_detected'
    }
    warnings.push(`Potential XSS detected (${xssCheck.risk} risk): ${xssCheck.patterns.slice(0, 3).join(', ')}`)
  }
  
  // Check length
  if (input.length > maxLength) {
    warnings.push(`Input exceeds maximum length of ${maxLength}`)
  }
  
  if (input.trim().length < minLength) {
    warnings.push(`Input is shorter than minimum length of ${minLength}`)
  }
  
  // Sanitize based on type
  let sanitized = sanitizeInput(input, allowHTML ? 'html' : type)
  
  return {
    isValid: !blocked && warnings.filter(w => w.includes('high risk')).length === 0,
    sanitized,
    warnings,
    blocked,
    blockReason
  }
}

/**
 * Middleware helper for request validation
 */
export function validateRequestBody(
  body: Record<string, unknown>,
  schema: Record<string, { type?: 'text' | 'html' | 'email' | 'phone' | 'id' | 'number'; required?: boolean }>
): { 
  isValid: boolean
  sanitized: Record<string, unknown>
  errors: string[]
  blockedFields: string[]
} {
  const sanitized: Record<string, unknown> = {}
  const errors: string[] = []
  const blockedFields: string[] = []
  
  for (const [field, config] of Object.entries(schema)) {
    const value = body[field]
    
    if (typeof value === 'string') {
      const result = validateAndSanitize(value, { ...config, type: config.type || 'text' })
      
      if (result.blocked) {
        blockedFields.push(field)
        errors.push(`${field}: ${result.blockReason}`)
      } else if (!result.isValid) {
        errors.push(`${field}: ${result.warnings.join('; ')}`)
      }
      
      sanitized[field] = result.sanitized
    } else if (value !== undefined) {
      sanitized[field] = value
    } else if (config.required) {
      errors.push(`${field}: required field is missing`)
      blockedFields.push(field)
    }
  }
  
  return {
    isValid: errors.length === 0 && blockedFields.length === 0,
    sanitized,
    errors,
    blockedFields
  }
}
