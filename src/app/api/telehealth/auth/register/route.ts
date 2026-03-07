import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/telehealth-db'
import { hashPassword } from '@/lib/auth'
import { createSession } from '@/lib/telehealth-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, specialty, licenseNumber } = body

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== 'patient' && role !== 'doctor') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Validate doctor-specific fields
    if (role === 'doctor' && (!specialty || !licenseNumber)) {
      return NextResponse.json(
        { error: 'Specialty and license number are required for doctors' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role
      }
    })

    // Create patient or doctor profile
    if (role === 'patient') {
      await prisma.patient.create({
        data: {
          userId: user.id
        }
      })
    } else {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialty,
          licenseNumber,
          isVerified: false,
          consultationFee: 5000 // Default fee
        }
      })
    }

    // Create session
    await createSession(user.id, user.email, user.name, role as 'patient' | 'doctor')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
