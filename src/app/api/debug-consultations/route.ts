// Debug endpoint to check consultations data
import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function GET() {
  try {
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({ error: 'No database connection' })
    }

    const p = prisma as any

    // Get all consultations
    const consultations = await p.consultations.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Check if referredTo column exists
    const columns = await p.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'consultations'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      totalConsultations: consultations.length,
      columns: columns,
      recentConsultations: consultations.map((c: any) => ({
        id: c.id,
        patientId: c.patientId,
        status: c.status,
        referredTo: c.referredTo,
        chiefComplaint: c.chiefComplaint?.substring(0, 50),
        createdAt: c.createdAt
      }))
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
