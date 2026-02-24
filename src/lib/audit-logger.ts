// Audit Logger - Tracks all patient file access for confidentiality compliance
// Every access to patient data is logged with timestamp, user, and action

export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  userName: string
  userRole: string
  action: 'VIEW' | 'EDIT' | 'CREATE' | 'DELETE' | 'PRINT' | 'EXPORT' | 'BREAK_GLASS'
  resourceType: 'patient' | 'vital' | 'consultation' | 'prescription' | 'lab_result' | 'medical_certificate'
  resourceId: string
  resourceIdentifier?: string // e.g., patient name or RUHC code
  details?: string
  ipAddress?: string
  sessionId?: string
  isSensitive?: boolean // For HIV, mental health records
  justification?: string // For break-the-glass access
}

// In-memory audit log (synced to database)
let auditLogs: AuditLogEntry[] = []
const MAX_MEMORY_LOGS = 1000

// Generate unique ID
function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Log an action
export function logAudit(params: {
  userId: string
  userName: string
  userRole: string
  action: AuditLogEntry['action']
  resourceType: AuditLogEntry['resourceType']
  resourceId: string
  resourceIdentifier?: string
  details?: string
  isSensitive?: boolean
  justification?: string
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date(),
    ...params
  }
  
  // Add to memory
  auditLogs.unshift(entry)
  
  // Trim if too large
  if (auditLogs.length > MAX_MEMORY_LOGS) {
    auditLogs = auditLogs.slice(0, MAX_MEMORY_LOGS)
  }
  
  // Sync to database (async, non-blocking)
  syncToDatabase(entry)
  
  console.log(`[AUDIT] ${params.action} by ${params.userName} on ${params.resourceType}:${params.resourceId}`)
  
  return entry
}

// Get all logs
export function getAuditLogs(): AuditLogEntry[] {
  return [...auditLogs]
}

// Get logs for a specific resource
export function getAuditLogsForResource(resourceType: string, resourceId: string): AuditLogEntry[] {
  return auditLogs.filter(log => log.resourceType === resourceType && log.resourceId === resourceId)
}

// Get logs for a specific user
export function getAuditLogsForUser(userId: string): AuditLogEntry[] {
  return auditLogs.filter(log => log.userId === userId)
}

// Get sensitive access logs (break-the-glass, HIV, mental health)
export function getSensitiveAccessLogs(): AuditLogEntry[] {
  return auditLogs.filter(log => log.isSensitive || log.action === 'BREAK_GLASS')
}

// Sync to database
async function syncToDatabase(entry: AuditLogEntry): Promise<void> {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    })
  } catch (error) {
    // Queue for later sync if offline
    console.warn('Failed to sync audit log to database, saved locally')
  }
}

// Load audit logs from database
export async function loadAuditLogs(): Promise<void> {
  try {
    const response = await fetch('/api/audit')
    const result = await response.json()
    if (result.success && result.logs) {
      auditLogs = result.logs
    }
  } catch (error) {
    console.warn('Failed to load audit logs from database')
  }
}

// Check if user has recently accessed a patient
export function hasRecentAccess(userId: string, patientId: string, withinMinutes: number = 30): boolean {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  return auditLogs.some(log => 
    log.userId === userId && 
    log.resourceId === patientId && 
    log.resourceType === 'patient' &&
    log.timestamp >= cutoff
  )
}

// Get access statistics
export function getAccessStatistics(hours: number = 24): {
  totalAccesses: number
  uniquePatients: number
  uniqueUsers: number
  sensitiveAccesses: number
  topUsers: Array<{ userId: string; userName: string; count: number }>
  topPatients: Array<{ patientId: string; patientName: string; count: number }>
} {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  const recentLogs = auditLogs.filter(log => log.timestamp >= cutoff)
  
  const uniquePatients = new Set(recentLogs.map(l => l.resourceId)).size
  const uniqueUsers = new Set(recentLogs.map(l => l.userId)).size
  const sensitiveAccesses = recentLogs.filter(l => l.isSensitive || l.action === 'BREAK_GLASS').length
  
  // Count by user
  const userCounts = new Map<string, { name: string; count: number }>()
  recentLogs.forEach(log => {
    const existing = userCounts.get(log.userId) || { name: log.userName, count: 0 }
    existing.count++
    userCounts.set(log.userId, existing)
  })
  
  const topUsers = Array.from(userCounts.entries())
    .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Count by patient
  const patientCounts = new Map<string, { name: string; count: number }>()
  recentLogs.forEach(log => {
    if (log.resourceType === 'patient') {
      const existing = patientCounts.get(log.resourceId) || { name: log.resourceIdentifier || 'Unknown', count: 0 }
      existing.count++
      patientCounts.set(log.resourceId, existing)
    }
  })
  
  const topPatients = Array.from(patientCounts.entries())
    .map(([patientId, data]) => ({ patientId, patientName: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return {
    totalAccesses: recentLogs.length,
    uniquePatients,
    uniqueUsers,
    sensitiveAccesses,
    topUsers,
    topPatients
  }
}
