// Test endpoint to verify consultation save
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, referredTo, status, chiefComplaint, staffName } = body

    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' })

    const p = prisma as any
    const id = `test-${Date.now()}`
    const now = new Date().toISOString()

    // Add columns if not exist
    try {
      await p.$executeRawUnsafe(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "referredTo" TEXT`)
      await p.$executeRawUnsafe(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "sentByNurseInitials" TEXT`)
    } catch (e) {}

    // Insert using raw SQL
    await p.$executeRawUnsafe(`
      INSERT INTO consultations (id, "patientId", status, "chiefComplaint", "referredTo", "sentByNurseInitials", "createdAt")
      VALUES (
        '${id}',
        '${patientId || 'unknown'}',
        '${status || 'pending_review'}',
        '${(chiefComplaint || '').replace(/'/g, "''")}',
        '${referredTo || 'nurse'}',
        '${(staffName || '').replace(/'/g, "''")}',
        '${now}'
      )
    `)

    // Fetch it back
    const result = await p.$queryRawUnsafe(`
      SELECT id, "patientId", status, "referredTo", "sentByNurseInitials", "createdAt"
      FROM consultations WHERE id = '${id}'
    `)

    return NextResponse.json({
      success: true,
      saved: Array.isArray(result) ? result[0] : result,
      receivedData: { patientId, referredTo, status, chiefComplaint, staffName }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack })
  }
}
