import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, getUserAgent, getDeviceInfo, getIPLocation } from '@/lib/ip-utils'
import { isIPBlocked, recordFailedAttempt, clearFailedAttempts, checkAdminAccess, getIPSettings } from '../ip-settings/route'

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
  
  return logEntry
}

// Clear old audit logs (keep last N days)
export function clearOldAuditLogs(daysToKeep: number = 90): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysToKeep)
  
  const initialLength = auditLogs.length
  auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= cutoff)
  
  return initialLength - auditLogs.length
}

// GET endpoint - retrieve audit logs
export async function GET(request: NextRequest) {
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
  
  return NextResponse.json({
    success: true,
    count: logs.length,
    total: auditLogs.length,
    logs
  })
}

// POST endpoint - add audit log or check status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = getClientIP(request)
    
    // Handle special request types
    if (body.type === 'check_blocked') {
      const blockedStatus = isIPBlocked(ip)
      return NextResponse.json({
        blocked: blockedStatus.blocked,
        reason: blockedStatus.reason,
        remainingMinutes: blockedStatus.remainingMinutes
      })
    }
    
    if (body.type === 'check_admin_access') {
      const accessStatus = await checkAdminAccess(ip, body.data?.userRole || '')
      return NextResponse.json({
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
        description: `Failed login attempt for email: ${body.email || 'unknown'}`,
        status: 'failed',
      })
      return NextResponse.json({
        success: true,
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
      return NextResponse.json({ success: true })
    }
    
    // Standard audit log entry
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
    
    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create audit log' }, { status: 500 })
  }
}

// DELETE endpoint - clear old logs
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90')
  
  const deleted = clearOldAuditLogs(daysToKeep)
  
  return NextResponse.json({
    success: true,
    message: `Deleted ${deleted} audit logs older than ${daysToKeep} days`
  })
}
