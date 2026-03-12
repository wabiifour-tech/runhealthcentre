import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const where: any = {}
    if (date) where.date = date
    if (staffId) where.staffId = staffId

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500
    })

    return NextResponse.json({ 
      success: true, 
      records 
    })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch attendance',
      details: error.message 
    }, { status: 500 })
  }
}

// POST - Sign in attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      staffId,
      staffName,
      staffRole,
      date,
      signInTime,
      signInPhoto,
      shift,
      status,
      deviceId,
      notes
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Check if already signed in today
    const existing = await prisma.attendance.findFirst({
      where: {
        staffId,
        date,
        signInTime: { not: null }
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Already signed in today',
        record: existing 
      }, { status: 400 })
    }

    // Insert attendance record
    const record = await prisma.attendance.create({
      data: {
        id: id || `att_${Date.now()}`,
        staffId,
        staffName,
        staffRole,
        date,
        signInTime,
        signInPhoto,
        shift: shift || 'morning',
        status: status || 'present',
        deviceId,
        notes
      }
    })

    return NextResponse.json({ 
      success: true, 
      record 
    })
  } catch (error: any) {
    console.error('Error signing in attendance:', error)
    return NextResponse.json({ 
      error: 'Failed to sign in',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT - Sign out attendance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, signOutTime, signOutPhoto, notes } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const record = await prisma.attendance.update({
      where: { id },
      data: {
        signOutTime,
        signOutPhoto,
        notes
      }
    })

    return NextResponse.json({ 
      success: true, 
      record 
    })
  } catch (error: any) {
    console.error('Error signing out attendance:', error)
    return NextResponse.json({ 
      error: 'Failed to sign out',
      details: error.message 
    }, { status: 500 })
  }
}
