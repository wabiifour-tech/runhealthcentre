import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/telehealth-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const search = searchParams.get('search')

    const where: any = {}

    if (specialty) {
      where.specialty = specialty
    }

    const doctors = await db.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    })

    // Filter by search if provided
    let filteredDoctors = doctors
    if (search) {
      const searchLower = search.toLowerCase()
      filteredDoctors = doctors.filter(d => 
        d.user.name.toLowerCase().includes(searchLower) ||
        d.specialty.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      doctors: filteredDoctors
    })
  } catch (error) {
    console.error('Get doctors error:', error)
    return NextResponse.json(
      { error: 'Failed to get doctors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, specialty, licenseNumber, hospital, bio, consultationFee } = body

    const doctor = await db.doctor.create({
      data: {
        userId,
        specialty,
        licenseNumber,
        hospital,
        bio,
        consultationFee: consultationFee || 5000
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      doctor
    })
  } catch (error) {
    console.error('Create doctor error:', error)
    return NextResponse.json(
      { error: 'Failed to create doctor profile' },
      { status: 500 }
    )
  }
}
