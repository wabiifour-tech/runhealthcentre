import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { consultationIds } = body

    if (!consultationIds || !Array.isArray(consultationIds) || consultationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No consultation IDs provided' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Delete consultations
    let deletedCount = 0
    for (const id of consultationIds) {
      try {
        await prisma.consultations.delete({
          where: { id }
        })
        deletedCount++
      } catch (err) {
        console.error(`Failed to delete consultation ${id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully cleared ${deletedCount} consultation(s)`
    })
  } catch (error) {
    console.error('Clear consultations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear consultations' },
      { status: 500 }
    )
  }
}
