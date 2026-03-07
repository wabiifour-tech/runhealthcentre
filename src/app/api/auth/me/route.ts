import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/telehealth-auth'
import { db } from '@/lib/telehealth-db'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get full user data with profile
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        doctor: true,
        patient: true
      }
    })

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password from response
    const { password, ...userData } = fullUser

    return NextResponse.json({
      success: true,
      user: userData
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    )
  }
}
