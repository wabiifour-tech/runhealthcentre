import { NextRequest, NextResponse } from 'next/server'
import { db } from './telehealth-db'
import bcrypt from 'bcryptjs'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Get session from cookie
export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
    const req = request || (typeof window === 'undefined' ? null : null)
    
    // For API routes, get from Authorization header or cookie
    if (req) {
      const sessionCookie = req.cookies.get('telehealth_session')?.value
      if (sessionCookie) {
        const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
        const session = JSON.parse(decoded)
        
        // Verify user still exists
        const user = await db.user.findUnique({
          where: { id: session.id },
          select: { id: true, email: true, name: true, role: true }
        })
        
        return user
      }
    }
    
    return null
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

// Set session cookie
export function setSessionCookie(response: NextResponse, user: SessionUser) {
  const sessionData = JSON.stringify(user)
  const encoded = Buffer.from(sessionData).toString('base64')
  
  response.cookies.set('telehealth_session', encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  
  return response
}

// Clear session cookie
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set('telehealth_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
  
  return response
}

// Require authentication middleware
export async function requireAuth(request: NextRequest): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSession(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return { user }
}

// Require specific role
export async function requireRole(request: NextRequest, role: string): Promise<{ user: SessionUser } | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  if (authResult.user.role !== role) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  return authResult
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
