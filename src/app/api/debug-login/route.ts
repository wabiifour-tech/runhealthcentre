// Debug endpoint to test login
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Hash for SuperAdmin password "#Abolaji7977"
const SUPERADMIN_HASH = '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC'
// Hash for admin password "admin123"
const ADMIN_HASH = '$2b$12$NBxbO8I55rmeBxz0fnWOCOVQih4lSfBdCAp4oAvAP6yUAj7lW8jkW'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const emailLower = email?.toLowerCase()
    
    // Determine which hash to use based on email
    const isSuperAdmin = emailLower === 'wabithetechnurse@ruhc'
    const isAdmin = emailLower === 'admin@ruhc'
    const testHash = isSuperAdmin ? SUPERADMIN_HASH : ADMIN_HASH
    
    // Test bcrypt
    const passwordMatch = await bcrypt.compare(password, testHash)
    
    // Check demo users
    const demoUsers = [
      { email: 'wabithetechnurse@ruhc', name: 'Wabi The Tech Nurse', role: 'SUPER_ADMIN' },
      { email: 'admin@ruhc', name: 'Administrator', role: 'ADMIN' }
    ]
    
    const user = demoUsers.find(u => u.email === emailLower)
    
    return NextResponse.json({
      receivedEmail: email,
      receivedPassword: password ? '***provided***' : 'missing',
      normalizedEmail: emailLower,
      userFound: !!user,
      passwordMatch,
      testHashUsed: testHash.substring(0, 20) + '...',
      expectedEmails: demoUsers.map(u => u.email)
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  // Generate a new hash for testing
  const hash = await bcrypt.hash('#Abolaji7977', 12)
  
  return NextResponse.json({
    message: 'Send POST request with { email, password } to test login',
    newHash: hash,
    testWithThis: {
      superAdmin: {
        email: 'wabithetechnurse@ruhc',
        password: '#Abolaji7977'
      },
      admin: {
        email: 'admin@ruhc',
        password: 'admin123'
      }
    }
  })
}
