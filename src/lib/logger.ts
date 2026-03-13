/**
 * Server-Side Logging Utility
 * Provides structured logging that only outputs server-side
 * NEVER logs sensitive information to client
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// Check if we're on the server
const isServer = typeof window === 'undefined'

// Log buffer for request-scoped logs (useful for debugging)
const logBuffer: LogEntry[] = []
const MAX_BUFFER_SIZE = 1000

/**
 * Format log entry for output
 */
function formatLog(entry: LogEntry): string {
  const { timestamp, level, module, message, data, error } = entry
  const levelColor = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m'  // red
  }[level]
  const reset = '\x1b[0m'
  
  let output = `${levelColor}[${timestamp}] [${level.toUpperCase().padEnd(5)}] [${module}]${reset} ${message}`
  
  if (data && Object.keys(data).length > 0) {
    output += `\n  Data: ${JSON.stringify(data, null, 2)}`
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`
    if (error.stack && process.env.NODE_ENV !== 'production') {
      output += `\n  Stack: ${error.stack}`
    }
  }
  
  return output
}

/**
 * Write log to buffer (for debugging and audit)
 */
function bufferLog(entry: LogEntry): void {
  logBuffer.push(entry)
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift()
  }
}

/**
 * Core logging function - server-side only
 */
function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>, err?: Error): void {
  // Only log on server
  if (!isServer) return

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data: data ? sanitizeData(data) : undefined,
    error: err ? {
      name: err.name,
      message: err.message,
      stack: err.stack
    } : undefined
  }

  // Buffer the log
  bufferLog(entry)

  // Output to console (server-side only)
  const formatted = formatLog(entry)
  
  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.error(formatted) // Use console.error to ensure it shows in Vercel logs
      }
      break
    case 'info':
      console.error(formatted)
      break
    case 'warn':
      console.error(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'credit_card', 'ssn']
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Create a module-specific logger
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', module, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', module, message, data),
    error: (message: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>) => {
      if (error instanceof Error) {
        log('error', module, message, data, error)
      } else {
        log('error', module, message, error || data)
      }
    }
  }
}

/**
 * Get buffered logs (for debugging)
 */
export function getBufferedLogs(): LogEntry[] {
  return [...logBuffer]
}

/**
 * Clear log buffer
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0
}

// Default logger for general use
export const logger = {
  debug: (module: string, message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
  info: (module: string, message: string, data?: Record<string, unknown>) => log('info', module, message, data),
  warn: (module: string, message: string, data?: Record<string, unknown>) => log('warn', module, message, data),
  error: (module: string, message: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      log('error', module, message, data, error)
    } else {
      log('error', module, message, error || data)
    }
  }
}

// Export for convenience
export type { LogLevel, LogEntry }
