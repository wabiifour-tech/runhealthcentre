import { NextResponse } from 'next/server'
import prisma from '@/lib/telehealth-db'

// GET - Fetch all verified doctors
export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { 
        isVerified: true 
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { rating: 'desc' }
    })

    return NextResponse.json({ doctors })
  } catch (error: any) {
    console.error('Fetch doctors error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}
