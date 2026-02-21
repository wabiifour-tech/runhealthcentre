/**
 * Audit Logging System for RUN Health Centre HMS
 * Comprehensive logging for compliance (HIPAA, NDPR Nigeria)
 * Records all user activities for accountability and security
 */

import { randomUUID } from 'crypto'

/**
 * Audit action types for healthcare systems
 */
export type AuditAction =
  // Authentication events
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  // Patient data access
  | 'VIEW_PATIENT'
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'DELETE_PATIENT'
  | 'SEARCH_PATIENTS'
  // Medical records
  | 'VIEW_CONSULTATION'
  | 'CREATE_CONSULTATION'
  | 'UPDATE_CONSULTATION'
  | 'VIEW_VITALS'
  | 'CREATE_VITALS'
  | 'VIEW_LAB_REQUEST'
  | 'CREATE_LAB_REQUEST'
  | 'UPDATE_LAB_REQUEST'
  | 'VIEW_PRESCRIPTION'
  | 'CREATE_PRESCRIPTION'
  | 'DISPENSE_MEDICATION'
  // Administrative actions
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'APPROVE_USER'
  | 'REJECT_USER'
  | 'CHANGE_ROLE'
  | 'DEACTIVATE_USER'
  | 'REACTIVATE_USER'
  // System events
  | 'SYSTEM_STARTUP'
  | 'SYSTEM_SHUTDOWN'
  | 'BACKUP_CREATED'
  | 'SETTINGS_CHANGED'
  | 'SECURITY_ALERT'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  // Financial
  | 'CREATE_PAYMENT'
  | 'REFUND_PAYMENT'
  | 'WALLET_DEPOSIT'
  | 'WALLET_WITHDRAWAL'
  // Security events
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'INJECTION_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'

/**
 * Entity types that can be audited
 */
export type AuditEntity =
  | 'USER'
  | 'PATIENT'
  | 'CONSULTATION'
  | 'VITAL_SIGN'
  | 'LAB_REQUEST'
  | 'LAB_RESULT'
  | 'PRESCRIPTION'
  | 'DRUG'
  | 'PAYMENT'
  | 'APPOINTMENT'
  | 'ADMISSION'
  | 'SYSTEM'
  | 'SESSION'

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId?: string
  userEmail?: string
  userRole?: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}

/**
 * Audit logger configuration
 */
interface AuditConfig {
  enabled: boolean
  logToConsole: boolean
  logToDatabase: boolean
  logToFile: boolean
  sensitiveFields: string[]
}

const DEFAULT_CONFIG: AuditConfig = {
  enabled: true,
  logToConsole: true,
  logToDatabase: true,
  logToFile: false, // Enable in production with proper file rotation
  sensitiveFields: [
    'password',
    'passwordHash',
    'ssn',
    'creditCard',
    'bankAccount',
    'pin'
  ]
}

/**
 * In-memory audit log store (for demo/fallback)
 * In production, use database or external logging service
 */
const auditLogMemory: AuditLogEntry[] = []
const MAX_MEMORY_LOGS = 10000

/**
 * Sanitize details to remove sensitive information
 */
function sanitizeDetails(details: string | Record<string, unknown> | undefined): string | undefined {
  if (!details) return undefined
  
  if (typeof details === 'string') {
    let sanitized = details
    for (const field of DEFAULT_CONFIG.sensitiveFields) {
      const regex = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, 'gi')
      sanitized = sanitized.replace(regex, `"${field}": "[REDACTED]"`)
    }
    return sanitized
  }
  
  // Handle object
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(details)) {
    if (DEFAULT_CONFIG.sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = JSON.parse(sanitizeDetails(JSON.stringify(value)) || '{}')
    } else {
      sanitized[key] = value
    }
  }
  return JSON.stringify(sanitized)
}

/**
 * Create audit log entry
 */
export async function createAuditLog(params: {
  userId?: string
  userEmail?: string
  userRole?: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  details?: string | Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success?: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: randomUUID(),
    timestamp: new Date(),
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    details: sanitizeDetails(params.details),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    sessionId: params.sessionId,
    success: params.success ?? true,
    errorMessage: params.errorMessage,
    metadata: params.metadata
  }
  
  // Store in memory (with limit)
  auditLogMemory.push(entry)
  if (auditLogMemory.length > MAX_MEMORY_LOGS) {
    auditLogMemory.shift()
  }
  
  // Log to console
  if (DEFAULT_CONFIG.logToConsole) {
    const logLevel = entry.success ? 'info' : 'warn'
    const message = formatLogMessage(entry)
    
    if (logLevel === 'warn') {
      console.warn(`[AUDIT] ${message}`)
    } else {
      console.log(`[AUDIT] ${message}`)
    }
  }
  
  // Try to log to database
  if (DEFAULT_CONFIG.logToDatabase) {
    try {
      const dbModule = await import('@/lib/db')
      const prisma = dbModule.default || dbModule.getPrisma?.()
      
      if (prisma) {
        const p = prisma as any
        await p.auditLog.create({
          data: {
            id: entry.id,
            userId: entry.userId,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId,
            details: entry.details,
            ipAddress: entry.ipAddress,
            createdAt: entry.timestamp
          }
        })
      }
    } catch (error) {
      // Database logging failed, already logged to console
      console.log('[AUDIT] Could not write to database:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  return entry
}

/**
 * Format audit log entry for console output
 */
function formatLogMessage(entry: AuditLogEntry): string {
  const user = entry.userEmail || entry.userId || 'Anonymous'
  const status = entry.success ? '✓' : '✗'
  const timestamp = entry.timestamp.toISOString()
  
  let message = `[${timestamp}] ${status} User: ${user} | Action: ${entry.action} | Entity: ${entry.entity}`
  
  if (entry.entityId) {
    message += ` | ID: ${entry.entityId}`
  }
  
  if (entry.details) {
    message += ` | Details: ${entry.details.slice(0, 200)}${entry.details.length > 200 ? '...' : ''}`
  }
  
  if (entry.ipAddress) {
    message += ` | IP: ${entry.ipAddress}`
  }
  
  if (!entry.success && entry.errorMessage) {
    message += ` | Error: ${entry.errorMessage}`
  }
  
  return message
}

/**
 * Get audit logs from memory
 */
export function getAuditLogs(options: {
  userId?: string
  action?: AuditAction
  entity?: AuditEntity
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
} = {}): AuditLogEntry[] {
  let logs = [...auditLogMemory]
  
  // Apply filters
  if (options.userId) {
    logs = logs.filter(l => l.userId === options.userId)
  }
  
  if (options.action) {
    logs = logs.filter(l => l.action === options.action)
  }
  
  if (options.entity) {
    logs = logs.filter(l => l.entity === options.entity)
  }
  
  if (options.entityId) {
    logs = logs.filter(l => l.entityId === options.entityId)
  }
  
  if (options.startDate) {
    logs = logs.filter(l => l.timestamp >= options.startDate!)
  }
  
  if (options.endDate) {
    logs = logs.filter(l => l.timestamp <= options.endDate!)
  }
  
  // Sort by timestamp descending
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  // Apply pagination
  const offset = options.offset || 0
  const limit = options.limit || 100
  
  return logs.slice(offset, offset + limit)
}

/**
 * Get audit logs from database
 */
export async function getAuditLogsFromDB(options: {
  userId?: string
  action?: string
  entity?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
} = {}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    const dbModule = await import('@/lib/db')
    const prisma = dbModule.default || dbModule.getPrisma?.()
    
    if (!prisma) {
      return { logs: getAuditLogs(options), total: auditLogMemory.length }
    }
    
    const p = prisma as any
    
    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (options.userId) where.userId = options.userId
    if (options.action) where.action = options.action
    if (options.entity) where.entity = options.entity
    if (options.entityId) where.entityId = options.entityId
    
    if (options.startDate || options.endDate) {
      where.createdAt = {}
      if (options.startDate) where.createdAt.gte = options.startDate
      if (options.endDate) where.createdAt.lte = options.endDate
    }
    
    const limit = options.limit || 100
    const offset = options.offset || 0
    
    const [logs, total] = await Promise.all([
      p.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      p.auditLog.count({ where })
    ])
    
    // Map database records to AuditLogEntry format
    const mappedLogs: AuditLogEntry[] = logs.map((log: any) => ({
      id: log.id,
      timestamp: log.createdAt,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      success: true
    }))
    
    return { logs: mappedLogs, total }
    
  } catch (error) {
    console.error('[AUDIT] Failed to fetch from database:', error)
    return { logs: getAuditLogs(options), total: auditLogMemory.length }
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_EXPIRED' | 'PASSWORD_CHANGE',
  params: {
    userId?: string
    userEmail?: string
    userRole?: string
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    success?: boolean
    errorMessage?: string
  }
): Promise<AuditLogEntry> {
  return createAuditLog({
    ...params,
    action,
    entity: 'SESSION',
    success: params.success ?? (action === 'LOGIN_SUCCESS' || action === 'LOGOUT')
  })
}

/**
 * Log patient data access
 */
export async function logPatientAccess(
  action: 'VIEW_PATIENT' | 'CREATE_PATIENT' | 'UPDATE_PATIENT' | 'DELETE_PATIENT' | 'SEARCH_PATIENTS',
  params: {
    userId: string
    userEmail?: string
    userRole?: string
    patientId?: string
    patientName?: string
    details?: string
    ipAddress?: string
    success?: boolean
  }
): Promise<AuditLogEntry> {
  return createAuditLog({
    ...params,
    action,
    entity: 'PATIENT',
    entityId: params.patientId,
    details: params.patientName ? `Patient: ${params.patientName}. ${params.details || ''}` : params.details
  })
}

/**
 * Log medical record access
 */
export async function logMedicalRecordAccess(
  action: 'VIEW_CONSULTATION' | 'CREATE_CONSULTATION' | 'UPDATE_CONSULTATION' | 'VIEW_VITALS' | 'CREATE_VITALS' | 'VIEW_LAB_REQUEST' | 'CREATE_LAB_REQUEST',
  params: {
    userId: string
    userEmail?: string
    userRole?: string
    patientId?: string
    recordId?: string
    recordType: AuditEntity
    details?: string
    ipAddress?: string
  }
): Promise<AuditLogEntry> {
  return createAuditLog({
    ...params,
    action,
    entity: params.recordType,
    entityId: params.recordId,
    details: params.patientId ? `Patient ID: ${params.patientId}. ${params.details || ''}` : params.details
  })
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'INJECTION_ATTEMPT' | 'UNAUTHORIZED_ACCESS' | 'ACCOUNT_LOCKED',
  params: {
    userId?: string
    userEmail?: string
    ipAddress?: string
    userAgent?: string
    details?: string
    metadata?: Record<string, unknown>
  }
): Promise<AuditLogEntry> {
  return createAuditLog({
    ...params,
    action,
    entity: 'SYSTEM',
    success: false,
    details: `SECURITY ALERT: ${params.details}`,
    metadata: params.metadata
  })
}

/**
 * Log administrative action
 */
export async function logAdminAction(
  action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'APPROVE_USER' | 'REJECT_USER' | 'CHANGE_ROLE' | 'DEACTIVATE_USER' | 'REACTIVATE_USER',
  params: {
    adminId: string
    adminEmail?: string
    adminRole?: string
    targetUserId?: string
    targetUserEmail?: string
    details?: string
    ipAddress?: string
  }
): Promise<AuditLogEntry> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action,
    entity: 'USER',
    entityId: params.targetUserId,
    details: params.targetUserEmail 
      ? `Target user: ${params.targetUserEmail}. ${params.details || ''}`
      : params.details,
    ipAddress: params.ipAddress
  })
}

/**
 * Get audit statistics for dashboard
 */
export function getAuditStats(): {
  totalLogs: number
  todayCount: number
  failedLogins: number
  securityAlerts: number
  patientAccessCount: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayLogs = auditLogMemory.filter(l => l.timestamp >= today)
  
  return {
    totalLogs: auditLogMemory.length,
    todayCount: todayLogs.length,
    failedLogins: todayLogs.filter(l => l.action === 'LOGIN_FAILED').length,
    securityAlerts: auditLogMemory.filter(l => 
      ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'INJECTION_ATTEMPT', 'UNAUTHORIZED_ACCESS'].includes(l.action)
    ).length,
    patientAccessCount: todayLogs.filter(l => l.entity === 'PATIENT').length
  }
}

/**
 * Clear old audit logs from memory
 */
export function clearOldAuditLogs(olderThanDays: number = 30): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - olderThanDays)
  
  const initialLength = auditLogMemory.length
  
  // Remove old logs (in place)
  for (let i = auditLogMemory.length - 1; i >= 0; i--) {
    if (auditLogMemory[i].timestamp < cutoff) {
      auditLogMemory.splice(i, 1)
    }
  }
  
  return initialLength - auditLogMemory.length
}

/**
 * Export audit logs for compliance reporting
 */
export function exportAuditLogs(options: {
  startDate?: Date
  endDate?: Date
  format?: 'json' | 'csv'
} = {}): string {
  const logs = getAuditLogs({
    startDate: options.startDate,
    endDate: options.endDate,
    limit: 10000
  })
  
  if (options.format === 'csv') {
    const headers = ['timestamp', 'user', 'action', 'entity', 'entityId', 'ipAddress', 'success', 'details']
    const rows = logs.map(l => [
      l.timestamp.toISOString(),
      l.userEmail || l.userId || 'anonymous',
      l.action,
      l.entity,
      l.entityId || '',
      l.ipAddress || '',
      l.success ? 'success' : 'failed',
      (l.details || '').replace(/"/g, '""')
    ])
    
    return [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }
  
  return JSON.stringify(logs, null, 2)
}
