// One-time fix to add missing columns
import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function GET() {
  try {
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' })

    const p = prisma as any

    // Force add columns
    try {
      await p.$executeRawUnsafe(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "referredTo" TEXT`)
      console.log('Added referredTo column')
    } catch (e: any) {
      console.log('referredTo:', e.message)
    }

    try {
      await p.$executeRawUnsafe(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "sentByNurseInitials" TEXT`)
      console.log('Added sentByNurseInitials column')
    } catch (e: any) {
      console.log('sentByNurseInitials:', e.message)
    }

    // Check columns
    const cols = await p.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'consultations' AND column_name IN ('referredTo', 'sentByNurseInitials')
    `

    // Get recent consultations
    const recent = await p.$queryRaw`SELECT id, status, "referredTo" FROM consultations ORDER BY "createdAt" DESC LIMIT 5`

    return NextResponse.json({
      success: true,
      columns: cols,
      recentConsultations: recent
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack })
  }
}
