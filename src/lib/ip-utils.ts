import { NextRequest } from 'next/server'

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP (for proxies, Cloudflare, Vercel, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip') // Cloudflare
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, first is client
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) return realIP.trim()
  if (cfIP) return cfIP.trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  // Fallback
  return 'unknown'
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

// Get device info from user agent
export function getDeviceInfo(userAgent: string): {
  device: string
  browser: string
  os: string
} {
  const ua = userAgent.toLowerCase()
  
  // Detect device
  let device = 'Desktop'
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'Tablet' : 'Mobile'
  }
  
  // Detect browser
  let browser = 'Unknown'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'
  
  // Detect OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  
  return { device, browser, os }
}

// IP location info (using free IP-API service)
export interface IPLocation {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  timezone: string
  isp: string
  status: string
}

export async function getIPLocation(ip: string): Promise<IPLocation | null> {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    // Local/private IP - return default
    return {
      ip,
      country: 'Local',
      countryCode: 'LOCAL',
      region: 'Local Network',
      city: 'Local',
      timezone: 'Africa/Lagos',
      isp: 'Local Network',
      status: 'success'
    }
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,isp,query`, {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    const data = await response.json()
    
    if (data.status === 'success') {
      return {
        ip: data.query,
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        isp: data.isp,
        status: data.status
      }
    }
    return null
  } catch (error) {
    console.error('IP location lookup failed:', error)
    return null
  }
}

// Check if IP is in whitelist
export function isIPAllowed(ip: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true // No whitelist = all allowed
  
  return whitelist.some(allowed => {
    // Exact match
    if (allowed === ip) return true
    
    // CIDR notation (e.g., 192.168.1.0/24)
    if (allowed.includes('/')) {
      return isInCIDRRange(ip, allowed)
    }
    
    // Wildcard (e.g., 192.168.1.*)
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\./g, '\\.').replace(/\*/g, '.*')
      return new RegExp(`^${pattern}$`).test(ip)
    }
    
    return false
  })
}

// Check if IP is in CIDR range
function isInCIDRRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/')
  const mask = parseInt(bits || '32', 10)
  
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(range)
  
  if (ipNum === null || rangeNum === null) return false
  
  const maskNum = mask === 32 ? 0xffffffff : ~((1 << (32 - mask)) - 1) >>> 0
  
  return (ipNum & maskNum) === (rangeNum & maskNum)
}

// Convert IP to number
function ipToNumber(ip: string): number | null {
  const parts = ip.split('.').map(p => parseInt(p, 10))
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return null
  }
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

// Default allowed IPs for admin access (can be configured in settings)
export const DEFAULT_ADMIN_IP_WHITELIST: string[] = [
  // Add your hospital IP ranges here
  // Example: '192.168.1.0/24' for local network
  // Leave empty to allow all IPs
]

// Nigerian IP ranges (optional - for restricting to Nigeria only)
export const NIGERIA_IP_RANGES = [
  // Major Nigerian ISP ranges
  '41.58.0.0/16',
  '41.71.128.0/17',
  '41.75.16.0/20',
  '41.75.48.0/20',
  '41.75.80.0/20',
  '41.76.64.0/20',
  '41.78.80.0/20',
  '41.78.112.0/20',
  '41.184.0.0/16',
  '41.189.0.0/19',
  '41.190.0.0/19',
  '41.203.64.0/20',
  '41.203.80.0/20',
  '41.203.96.0/20',
  '41.204.224.0/19',
  '41.216.160.0/20',
  '41.217.0.0/17',
  '41.219.0.0/16',
  '41.220.64.0/20',
  '41.221.112.0/20',
  '41.222.40.0/21',
  '41.222.48.0/21',
  '41.222.76.0/22',
  '41.223.64.0/22',
  '41.223.128.0/22',
  '102.0.0.0/8',
  '105.112.0.0/12',
  '154.0.128.0/17',
  '154.16.0.0/16',
  '154.72.0.0/16',
  '156.0.0.0/14',
  '160.0.0.0/12',
  '169.255.0.0/16',
  '197.128.0.0/10',
  '41.138.0.0/15',
]

// Check if IP is from Nigeria
export function isNigerianIP(ip: string): boolean {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return true // Allow local IPs
  }
  return isIPAllowed(ip, NIGERIA_IP_RANGES)
}
