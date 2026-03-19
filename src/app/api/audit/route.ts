import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, getUserAgent, getDeviceInfo, getIPLocation } from '@/lib/ip-utils'
import { isIPBlocked, recordFailedAttempt, clearFailedAttempts, checkAdminAccess } from '../ip-settings/route'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('Audit')

// Audit Log interface
export interface AuditLogEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'print' | 'export' | 'failed_login' | 'successful_login' | 'ip_blocked' | 'access_denied' | 'signup'
  entityType: string
  entityId: string
  entityName?: string
  description: string
  oldValue?: string
  newValue?: string
  ipAddress: string
  ipLocation?: string
  deviceInfo: string
  userAgent: string
  status: 'success' | 'failed' | 'blocked'
  reason?: string
}

// In-memory audit log store (in production, use a database)
let auditLogs: AuditLogEntry[] = []

// Get all audit logs
export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Add audit log entry
export async function addAuditLog(
  request: NextRequest | null,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'ipLocation' | 'deviceInfo' | 'userAgent'>
): Promise<AuditLogEntry> {
  const ip = request ? getClientIP(request) : 'system'
  const userAgent = request ? getUserAgent(request) : 'system'
  const deviceInfo = getDeviceInfo(userAgent)
  
  // Get IP location (async, don't wait too long)
  let ipLocation = ''
  if (request && ip !== 'unknown') {
    try {
      const location = await getIPLocation(ip)
      if (location) {
        ipLocation = `${location.city}, ${location.country}`
      }
    } catch {
      // Ignore location errors
    }
  }
  
  const logEntry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...entry,
    ipAddress: ip,
    ipLocation,
    deviceInfo: `${deviceInfo.device} - ${deviceInfo.browser} on ${deviceInfo.os}`,
    userAgent,
  }
  
  auditLogs.push(logEntry)
  
  // Keep only last 10000 logs in memory
  if (auditLogs.length > 10000) {
    auditLogs = auditLogs.slice(-10000)
  }
  
  logger.info('Audit log added', { 
    action: entry.action, 
    userId: entry.userId, 
    entityType: entry.entityType 
  })
  
  return logEntry
}

// Add audit log without request (for system actions)
export function addSystemAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'ipLocation' | 'deviceInfo' | 'userAgent'>
): AuditLogEntry {
  const logEntry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...entry,
    ipAddress: 'system',
    ipLocation: 'System',
    deviceInfo: 'Server',
    userAgent: 'System',
  }
  
  auditLogs.push(logEntry)
  
  if (auditLogs.length > 10000) {
    auditLogs = auditLogs.slice(-10000)
  }
  
  logger.info('System audit log added', { action: entry.action })
  
  return logEntry
}

// Clear old audit logs (keep last N days)
export function clearOldAuditLogs(daysToKeep: number = 90): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysToKeep)
  
  const initialLength = auditLogs.length
  auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= cutoff)
  
  const removed = initialLength - auditLogs.length
  if (removed > 0) {
    logger.info('Old audit logs cleared', { removed, remaining: auditLogs.length })
  }
  
  return removed
}

// GET endpoint - retrieve audit logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let logs = getAuditLogs()
    
    // Filter by user
    if (userId) {
      logs = logs.filter(log => log.userId === userId)
    }
    
    // Filter by action
    if (action) {
      logs = logs.filter(log => log.action === action)
    }
    
    // Filter by entity type
    if (entityType) {
      logs = logs.filter(log => log.entityType === entityType)
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate)
      logs = logs.filter(log => new Date(log.timestamp) >= start)
    }
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      logs = logs.filter(log => new Date(log.timestamp) <= end)
    }
    
    // Apply limit
    logs = logs.slice(0, limit)
    
    logger.info('Audit logs retrieved', { 
      admin: auth.user?.email, 
      count: logs.length,
      filters: { userId, action, entityType, startDate, endDate }
    })

    return successResponse({
      count: logs.length,
      total: auditLogs.length,
      logs
    })
  } catch (error) {
    return errorResponse(error, { module: 'Audit', operation: 'getLogs' })
  }
}

// POST endpoint - add audit log or check status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = getClientIP(request)
    
    // Handle special request types
    if (body.type === 'check_blocked') {
      const blockedStatus = isIPBlocked(ip)
      return successResponse({
        blocked: blockedStatus.blocked,
        reason: blockedStatus.reason,
        remainingMinutes: blockedStatus.remainingMinutes
      })
    }
    
    if (body.type === 'check_admin_access') {
      const accessStatus = await checkAdminAccess(ip, body.data?.userRole || '')
      return successResponse({
        allowed: accessStatus.allowed,
        reason: accessStatus.reason
      })
    }
    
    if (body.type === 'failed_login') {
      const result = recordFailedAttempt(ip)
      await addAuditLog(request, {
        userId: body.userId || 'unknown',
        userName: body.userName || 'unknown',
        userRole: body.userRole || 'unknown',
        action: 'failed_login',
        entityType: 'authentication',
        entityId: 'login_attempt',
        description: `Failed login attempt`,
        status: 'failed',
      })
      return successResponse({
        blocked: result.blocked,
        attemptsRemaining: result.attemptsRemaining
      })
    }
    
    if (body.type === 'successful_login') {
      clearFailedAttempts(ip)
      await addAuditLog(request, {
        userId: body.userId,
        userName: body.userName,
        userRole: body.userRole,
        action: 'login',
        entityType: 'authentication',
        entityId: 'login',
        description: `User logged in successfully`,
        status: 'success',
      })
      return successResponse({})
    }
    
    // Standard audit log entry - requires authentication
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      throw Errors.unauthorized(auth.error)
    }

    const entry = await addAuditLog(request, {
      userId: body.userId,
      userName: body.userName,
      userRole: body.userRole,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      entityName: body.entityName,
      description: body.description,
      oldValue: body.oldValue,
      newValue: body.newValue,
      status: body.status || 'success',
      reason: body.reason,
    })
    
    return successResponse({ entry })
  } catch (error) {
    return errorResponse(error, { module: 'Audit', operation: 'addLog' })
  }
}

// DELETE endpoint - clear old logs (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await authenticateRequest(request, { requireAdmin: true })
    if (!auth.authenticated) {
      throw Errors.forbidden(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90')
    
    const deleted = clearOldAuditLogs(daysToKeep)
    
    logger.info('Audit logs cleared', { 
      admin: auth.user?.email, 
      daysToKeep, 
      deleted 
    })
    
    return successResponse({
      message: `Deleted ${deleted} audit logs older than ${daysToKeep} days`
    })
  } catch (error) {
    return errorResponse(error, { module: 'Audit', operation: 'clearLogs' })
  }
}
