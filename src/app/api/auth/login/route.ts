import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/telehealth-db'
import { verifyPassword, setSessionCookie } from '@/lib/telehealth-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get role-specific data
    let profileData = null
    if (user.role === 'doctor') {
      profileData = await db.doctor.findUnique({
        where: { userId: user.id }
      })
    } else {
      profileData = await db.patient.findUnique({
        where: { userId: user.id }
      })
    }

    // Create response with session
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profileData
      }
    })

    setSessionCookie(response, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
