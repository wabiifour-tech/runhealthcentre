// TeleHealth Nigeria Session Management
import { cookies } from 'next/headers'
import { db } from './telehealth-db'

export interface TeleHealthUser {
  id: string
  email: string
  name: string
  phone: string
  role: 'patient' | 'doctor'
}

export interface TeleHealthSession {
  userId: string
  email: string
  name: string
  role: 'patient' | 'doctor'
  expiresAt: number
}

const SESSION_COOKIE_NAME = 'telehealth_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Simple in-memory session store (for development)
const sessions = new Map<string, TeleHealthSession>()

export async function createSession(userId: string, email: string, name: string, role: 'patient' | 'doctor'): Promise<string> {
  const sessionId = crypto.randomUUID()
  const session: TeleHealthSession = {
    userId,
    email,
    name,
    role,
    expiresAt: Date.now() + SESSION_DURATION
  }
  
  sessions.set(sessionId, session)
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000
  })
  
  return sessionId
}

export async function getSession(): Promise<TeleHealthSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionId) {
      return null
    }
    
    const session = sessions.get(sessionId)
    
    if (!session) {
      return null
    }
    
    if (session.expiresAt < Date.now()) {
      sessions.delete(sessionId)
      return null
    }
    
    return session
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    
    if (sessionId) {
      sessions.delete(sessionId)
    }
    
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch {
    // Ignore errors during deletion
  }
}

export async function getCurrentUser(): Promise<TeleHealthUser | null> {
  const session = await getSession()
  
  if (!session) {
    return null
  }
  
  const prisma = await db.client
  
  if (!prisma) {
    return null
  }
  
  const user = await prisma.User.findUnique({
    where: { id: session.userId }
  })
  
  if (!user) {
    return null
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role
  }
}
