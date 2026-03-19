/**
 * STABILITY PROTECTIONS - Structured Error Logging
 * 
 * Logs are written for:
 * - Database errors
 * - API errors
 * - Authentication failures
 * 
 * Logs help diagnose problems without breaking the system.
 */

import { createLogger } from './logger'

const logger = createLogger('ErrorTracker')

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error categories
export type ErrorCategory = 
  | 'database'
  | 'api'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'external_service'
  | 'system'

// Structured error log entry
export interface ErrorLogEntry {
  id: string
  timestamp: string
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  code?: string
  stack?: string
  context?: {
    userId?: string
    requestId?: string
    endpoint?: string
    method?: string
    ip?: string
    userAgent?: string
    [key: string]: any
  }
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

// In-memory error log (for development)
const errorLog: ErrorLogEntry[] = []
const MAX_LOG_SIZE = 1000

// Generate unique ID
function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log an error with structured data
 */
export function logError(
  category: ErrorCategory,
  message: string,
  options: {
    severity?: ErrorSeverity
    code?: string
    error?: Error
    context?: ErrorLogEntry['context']
  } = {}
): ErrorLogEntry {
  const entry: ErrorLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    category,
    severity: options.severity || 'medium',
    message,
    code: options.code,
    stack: options.error?.stack,
    context: options.context,
    resolved: false
  }

  // Add to in-memory log
  errorLog.unshift(entry)
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.pop()
  }

  // Log based on severity
  const logMessage = `[${category.toUpperCase()}] ${message}`
  switch (entry.severity) {
    case 'critical':
      logger.error(logMessage, { ...options.context, stack: options.error?.stack })
      // In production, this should trigger alerts
      break
    case 'high':
      logger.error(logMessage, options.context)
      break
    case 'medium':
      logger.warn(logMessage, options.context)
      break
    case 'low':
      logger.info(logMessage, options.context)
      break
  }

  return entry
}

/**
 * Log database error
 */
export function logDatabaseError(
  operation: string,
  error: Error,
  context?: { table?: string; query?: string; [key: string]: any }
): ErrorLogEntry {
  return logError('database', `Database error during ${operation}`, {
    severity: 'high',
    code: 'DB_ERROR',
    error,
    context: { operation, ...context }
  })
}

/**
 * Log API error
 */
export function logApiError(
  endpoint: string,
  message: string,
  options: {
    statusCode?: number
    method?: string
    error?: Error
    context?: Record<string, any>
  } = {}
): ErrorLogEntry {
  return logError('api', `API Error [${options.method || 'UNKNOWN'}] ${endpoint}: ${message}`, {
    severity: options.statusCode && options.statusCode >= 500 ? 'high' : 'medium',
    code: `HTTP_${options.statusCode || 500}`,
    error: options.error,
    context: {
      endpoint,
      method: options.method,
      statusCode: options.statusCode,
      ...options.context
    }
  })
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  reason: string,
  context?: {
    email?: string
    ip?: string
    userAgent?: string
    [key: string]: any
  }
): ErrorLogEntry {
  return logError('authentication', `Authentication failed: ${reason}`, {
    severity: 'medium',
    code: 'AUTH_FAILED',
    context
  })
}

/**
 * Log authorization failure
 */
export function logAuthorizationFailure(
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, any>
): ErrorLogEntry {
  return logError('authorization', `Authorization denied: ${userId} cannot ${action} on ${resource}`, {
    severity: 'medium',
    code: 'AUTH_DENIED',
    context: { userId, action, resource, ...context }
  })
}

/**
 * Get error logs
 */
export function getErrorLogs(options: {
  category?: ErrorCategory
  severity?: ErrorSeverity
  limit?: number
  unresolved?: boolean
} = {}): ErrorLogEntry[] {
  let filtered = [...errorLog]

  if (options.category) {
    filtered = filtered.filter(e => e.category === options.category)
  }
  if (options.severity) {
    filtered = filtered.filter(e => e.severity === options.severity)
  }
  if (options.unresolved) {
    filtered = filtered.filter(e => !e.resolved)
  }

  return filtered.slice(0, options.limit || 100)
}

/**
 * Mark error as resolved
 */
export function resolveError(errorId: string, resolvedBy?: string): boolean {
  const entry = errorLog.find(e => e.id === errorId)
  if (entry) {
    entry.resolved = true
    entry.resolvedAt = new Date().toISOString()
    entry.resolvedBy = resolvedBy
    return true
  }
  return false
}

/**
 * Get error statistics
 */
export function getErrorStats(): {
  total: number
  unresolved: number
  byCategory: Record<ErrorCategory, number>
  bySeverity: Record<ErrorSeverity, number>
} {
  const byCategory: Record<string, number> = {}
  const bySeverity: Record<string, number> = {}

  errorLog.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1
  })

  return {
    total: errorLog.length,
    unresolved: errorLog.filter(e => !e.resolved).length,
    byCategory: byCategory as Record<ErrorCategory, number>,
    bySeverity: bySeverity as Record<ErrorSeverity, number>
  }
}
