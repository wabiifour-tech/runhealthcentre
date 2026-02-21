/**
 * Session Fingerprinting System for RUN Health Centre HMS
 * Prevents session hijacking by validating user's browser/device characteristics
 * Creates unique fingerprint to detect suspicious session changes
 */

import { createHash, randomUUID } from 'crypto'

/**
 * Session fingerprint data
 */
export interface SessionFingerprint {
  id: string
  userId: string
  sessionId: string
  
  // Browser characteristics
  userAgent: string
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  
  // Network characteristics
  ipAddress: string
  ipHash: string // Hashed for privacy
  
  // Client characteristics (collected from frontend)
  timezone?: string
  language?: string
  screenResolution?: string
  colorDepth?: number
  deviceMemory?: number
  cpuCores?: number
  platform?: string
  touchSupport?: boolean
  webglRenderer?: string
  
  // Computed fingerprint hash
  fingerprintHash: string
  
  // Timestamps
  createdAt: Date
  lastVerifiedAt: Date
  
  // Verification status
  isValid: boolean
  mismatchReason?: string
}

/**
 * Fingerprint mismatch result
 */
export interface FingerprintCheckResult {
  isValid: boolean
  confidence: number // 0-100
  mismatches: string[]
  risk: 'low' | 'medium' | 'high'
  recommendedAction: 'allow' | 'warn' | 'challenge' | 'terminate'
}

/**
 * In-memory store for fingerprints
 * In production, use database or Redis
 */
const fingerprintStore = new Map<string, SessionFingerprint>()

/**
 * Parse User-Agent string
 */
export function parseUserAgent(userAgent: string): {
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
} {
  const ua = userAgent.toLowerCase()
  
  // Detect browser
  let browserName = 'Unknown'
  let browserVersion = ''
  
  if (ua.includes('edg/')) {
    browserName = 'Edge'
    browserVersion = ua.match(/edg\/(\d+\.?\d*)/)?.[1] || ''
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browserName = 'Chrome'
    browserVersion = ua.match(/chrome\/(\d+\.?\d*)/)?.[1] || ''
  } else if (ua.includes('firefox/')) {
    browserName = 'Firefox'
    browserVersion = ua.match(/firefox\/(\d+\.?\d*)/)?.[1] || ''
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browserName = 'Safari'
    browserVersion = ua.match(/version\/(\d+\.?\d*)/)?.[1] || ''
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browserName = 'Opera'
    browserVersion = ua.match(/(?:opera|opr)\/(\d+\.?\d*)/)?.[1] || ''
  }
  
  // Detect OS
  let osName = 'Unknown'
  let osVersion = ''
  
  if (ua.includes('windows nt 10')) {
    osName = 'Windows'
    osVersion = '10/11'
  } else if (ua.includes('windows nt 6.3')) {
    osName = 'Windows'
    osVersion = '8.1'
  } else if (ua.includes('windows nt 6.1')) {
    osName = 'Windows'
    osVersion = '7'
  } else if (ua.includes('mac os x')) {
    osName = 'macOS'
    osVersion = ua.match(/mac os x (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
  } else if (ua.includes('android')) {
    osName = 'Android'
    osVersion = ua.match(/android (\d+\.?\d*)/)?.[1] || ''
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = 'iOS'
    osVersion = ua.match(/os (\d+[._]\d+)/)?.[1]?.replace('_', '.') || ''
  } else if (ua.includes('linux')) {
    osName = 'Linux'
    osVersion = ''
  }
  
  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop'
  
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet'
    } else {
      deviceType = 'mobile'
    }
  }
  
  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType
  }
}

/**
 * Hash a value for privacy
 */
function hashValue(value: string): string {
  return createHash('sha256')
    .update(value + process.env.FINGERPRINT_SALT || 'run-hms-fingerprint-salt')
    .digest('hex')
    .substring(0, 16)
}

/**
 * Compute fingerprint hash from characteristics
 */
function computeFingerprintHash(params: {
  userAgent: string
  ipAddress: string
  timezone?: string
  screenResolution?: string
  language?: string
}): string {
  const components = [
    params.userAgent,
    hashValue(params.ipAddress),
    params.timezone || '',
    params.screenResolution || '',
    params.language || ''
  ]
  
  return hashValue(components.join('|'))
}

/**
 * Create a new session fingerprint
 */
export function createFingerprint(params: {
  userId: string
  sessionId: string
  userAgent: string
  ipAddress: string
  clientData?: {
    timezone?: string
    language?: string
    screenResolution?: string
    colorDepth?: number
    deviceMemory?: number
    cpuCores?: number
    platform?: string
    touchSupport?: boolean
    webglRenderer?: string
  }
}): SessionFingerprint {
  const parsedUA = parseUserAgent(params.userAgent)
  const fingerprintHash = computeFingerprintHash({
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
    timezone: params.clientData?.timezone,
    screenResolution: params.clientData?.screenResolution,
    language: params.clientData?.language
  })
  
  const fingerprint: SessionFingerprint = {
    id: randomUUID(),
    userId: params.userId,
    sessionId: params.sessionId,
    userAgent: params.userAgent,
    browserName: parsedUA.browserName,
    browserVersion: parsedUA.browserVersion,
    osName: parsedUA.osName,
    osVersion: parsedUA.osVersion,
    deviceType: parsedUA.deviceType,
    ipAddress: params.ipAddress,
    ipHash: hashValue(params.ipAddress),
    timezone: params.clientData?.timezone,
    language: params.clientData?.language,
    screenResolution: params.clientData?.screenResolution,
    colorDepth: params.clientData?.colorDepth,
    deviceMemory: params.clientData?.deviceMemory,
    cpuCores: params.clientData?.cpuCores,
    platform: params.clientData?.platform,
    touchSupport: params.clientData?.touchSupport,
    webglRenderer: params.clientData?.webglRenderer,
    fingerprintHash,
    createdAt: new Date(),
    lastVerifiedAt: new Date(),
    isValid: true
  }
  
  // Store fingerprint
  fingerprintStore.set(params.sessionId, fingerprint)
  
  return fingerprint
}

/**
 * Verify session fingerprint
 */
export function verifyFingerprint(params: {
  sessionId: string
  userAgent: string
  ipAddress: string
  clientData?: {
    timezone?: string
    language?: string
    screenResolution?: string
  }
}): FingerprintCheckResult {
  const stored = fingerprintStore.get(params.sessionId)
  
  if (!stored) {
    return {
      isValid: false,
      confidence: 0,
      mismatches: ['Session fingerprint not found'],
      risk: 'high',
      recommendedAction: 'terminate'
    }
  }
  
  const mismatches: string[] = []
  let confidence = 100
  
  // Check User-Agent (critical)
  if (stored.userAgent !== params.userAgent) {
    // Parse both to see if it's a minor version change
    const storedUA = parseUserAgent(stored.userAgent)
    const currentUA = parseUserAgent(params.userAgent)
    
    if (storedUA.browserName !== currentUA.browserName || storedUA.osName !== currentUA.osName) {
      mismatches.push('Browser/OS changed')
      confidence -= 50
    } else if (storedUA.browserVersion !== currentUA.browserVersion) {
      mismatches.push('Browser version changed')
      confidence -= 10
    }
  }
  
  // Check IP address (warning level)
  if (stored.ipAddress !== params.ipAddress) {
    // Check if IP class changed significantly
    const storedParts = stored.ipAddress.split('.')
    const currentParts = params.ipAddress.split('.')
    
    if (storedParts.length === 4 && currentParts.length === 4) {
      // Same /24 subnet is usually fine (same network)
      if (storedParts[0] === currentParts[0] && storedParts[1] === currentParts[1] && storedParts[2] === currentParts[2]) {
        mismatches.push('IP address changed (same subnet)')
        confidence -= 5
      } else if (storedParts[0] === currentParts[0] && storedParts[1] === currentParts[1]) {
        mismatches.push('IP address changed (same network)')
        confidence -= 15
      } else {
        mismatches.push('IP address changed significantly')
        confidence -= 30
      }
    } else {
      mismatches.push('IP address changed')
      confidence -= 25
    }
  }
  
  // Check timezone (warning level)
  if (params.clientData?.timezone && stored.timezone && stored.timezone !== params.clientData.timezone) {
    mismatches.push(`Timezone changed from ${stored.timezone} to ${params.clientData.timezone}`)
    confidence -= 20
  }
  
  // Check screen resolution (minor)
  if (params.clientData?.screenResolution && stored.screenResolution && stored.screenResolution !== params.clientData.screenResolution) {
    mismatches.push('Screen resolution changed')
    confidence -= 5
  }
  
  // Check language (minor)
  if (params.clientData?.language && stored.language && stored.language !== params.clientData.language) {
    mismatches.push('Language changed')
    confidence -= 5
  }
  
  // Compute new fingerprint hash for comparison
  const currentHash = computeFingerprintHash({
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
    timezone: params.clientData?.timezone,
    screenResolution: params.clientData?.screenResolution,
    language: params.clientData?.language
  })
  
  // Determine risk level and recommended action
  let risk: 'low' | 'medium' | 'high' = 'low'
  let recommendedAction: 'allow' | 'warn' | 'challenge' | 'terminate' = 'allow'
  
  if (confidence < 30) {
    risk = 'high'
    recommendedAction = 'terminate'
  } else if (confidence < 50) {
    risk = 'high'
    recommendedAction = 'challenge'
  } else if (confidence < 70) {
    risk = 'medium'
    recommendedAction = 'warn'
  } else if (mismatches.length > 0) {
    risk = 'low'
    recommendedAction = 'allow'
  }
  
  // Update last verified time
  stored.lastVerifiedAt = new Date()
  
  if (recommendedAction === 'terminate') {
    stored.isValid = false
    stored.mismatchReason = mismatches.join('; ')
  }
  
  return {
    isValid: confidence >= 50,
    confidence,
    mismatches,
    risk,
    recommendedAction
  }
}

/**
 * Get fingerprint for a session
 */
export function getFingerprint(sessionId: string): SessionFingerprint | undefined {
  return fingerprintStore.get(sessionId)
}

/**
 * Delete fingerprint (on logout)
 */
export function deleteFingerprint(sessionId: string): boolean {
  return fingerprintStore.delete(sessionId)
}

/**
 * Get all fingerprints for a user
 */
export function getUserFingerprints(userId: string): SessionFingerprint[] {
  return Array.from(fingerprintStore.values()).filter(fp => fp.userId === userId)
}

/**
 * Detect suspicious patterns across sessions
 */
export function detectSuspiciousPatterns(userId: string): {
  isSuspicious: boolean
  reasons: string[]
  activeSessions: number
} {
  const fingerprints = getUserFingerprints(userId)
  const activeFingerprints = fingerprints.filter(fp => fp.isValid)
  
  const reasons: string[] = []
  
  // Check for multiple active sessions from different devices
  if (activeFingerprints.length > 3) {
    reasons.push('Multiple active sessions detected')
  }
  
  // Check for sessions from different countries/regions
  const uniqueIPs = new Set(activeFingerprints.map(fp => fp.ipHash))
  if (uniqueIPs.size > 2 && activeFingerprints.length > 1) {
    reasons.push('Sessions from multiple networks')
  }
  
  // Check for rapid IP changes
  const recentFingerprints = activeFingerprints.filter(fp => {
    const hourAgo = new Date()
    hourAgo.setHours(hourAgo.getHours() - 1)
    return fp.createdAt >= hourAgo
  })
  
  if (recentFingerprints.length > 2) {
    reasons.push('Multiple sessions created recently')
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
    activeSessions: activeFingerprints.length
  }
}

/**
 * Terminate all sessions for a user except current
 */
export function terminateOtherSessions(userId: string, currentSessionId: string): number {
  let terminated = 0
  
  for (const [sessionId, fingerprint] of fingerprintStore.entries()) {
    if (fingerprint.userId === userId && sessionId !== currentSessionId) {
      fingerprint.isValid = false
      fingerprint.mismatchReason = 'Terminated by user'
      terminated++
    }
  }
  
  return terminated
}

/**
 * Client-side script to collect fingerprint data
 * This should be included in the frontend
 */
export const CLIENT_FINGERPRINT_SCRIPT = `
// Collect browser fingerprint data
async function collectFingerprintData() {
  const data = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screenResolution: \`\${screen.width}x\${screen.height}\`,
    colorDepth: screen.colorDepth,
    deviceMemory: navigator.deviceMemory,
    cpuCores: navigator.hardwareConcurrency,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
  
  // Try to get WebGL renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        data.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {}
  
  return data;
}

// Send fingerprint data to server
async function sendFingerprint(sessionId) {
  const data = await collectFingerprintData();
  await fetch('/api/auth/fingerprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...data })
  });
}
`

/**
 * Clean up old fingerprints
 */
export function cleanupOldFingerprints(maxAge: number = 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAge)
  let cleaned = 0
  
  for (const [sessionId, fingerprint] of fingerprintStore.entries()) {
    if (fingerprint.lastVerifiedAt < cutoff || !fingerprint.isValid) {
      fingerprintStore.delete(sessionId)
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Get fingerprint statistics
 */
export function getFingerprintStats(): {
  totalFingerprints: number
  activeFingerprints: number
  invalidFingerprints: number
  uniqueUsers: number
} {
  const all = Array.from(fingerprintStore.values())
  
  return {
    totalFingerprints: all.length,
    activeFingerprints: all.filter(fp => fp.isValid).length,
    invalidFingerprints: all.filter(fp => !fp.isValid).length,
    uniqueUsers: new Set(all.map(fp => fp.userId)).size
  }
}
