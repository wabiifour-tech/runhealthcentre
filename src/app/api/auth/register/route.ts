import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/telehealth-db'
import { hashPassword, setSessionCookie } from '@/lib/telehealth-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, email, phone, password, role, 
      // Doctor-specific fields
      specialty, licenseNumber, hospital, bio, consultationFee,
      // Bank details for doctors
      bankName, accountNumber, accountName
    } = body

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be patient or doctor' },
        { status: 400 }
      )
    }

    // Doctor-specific validation
    if (role === 'doctor') {
      if (!specialty || !licenseNumber) {
        return NextResponse.json(
          { error: 'Doctors must provide specialty and license number' },
          { status: 400 }
        )
      }
      
      // Validate bank details
      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json(
          { error: 'Doctors must provide bank account details for receiving payments' },
          { status: 400 }
        )
      }
      
      // Validate account number format (10 digits)
      if (!/^\d{10}$/.test(accountNumber)) {
        return NextResponse.json(
          { error: 'Account number must be 10 digits' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
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
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role
      }
    })

    // Create role-specific profile
    if (role === 'doctor') {
      await db.doctor.create({
        data: {
          userId: user.id,
          specialty,
          licenseNumber,
          hospital: hospital || null,
          bio: bio || null,
          consultationFee: consultationFee || 5000,
          // Bank details
          bankName,
          accountNumber,
          accountName
        }
      })
    } else {
      await db.patient.create({
        data: {
          userId: user.id
        }
      })
    }

    // Create response with session
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
