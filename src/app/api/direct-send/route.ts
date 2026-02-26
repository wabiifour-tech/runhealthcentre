// Direct send - bypass all the complex logic
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' })

    const p = prisma as any
    const id = `direct-${Date.now()}`
    const now = new Date().toISOString()

    // Extract values with defaults
    const patientId = body.patientId || 'test-patient'
    const referredTo = body.referredTo || 'nurse'
    const status = body.status || 'pending_review'
    const chiefComplaint = (body.chiefComplaint || 'Direct test').replace(/'/g, "''")
    const staffName = (body.staffName || 'Test Staff').replace(/'/g, "''")

    // Direct insert - include all required columns
    const sql = `INSERT INTO consultations (id, status, "chiefComplaint", "referredTo", "sentByNurseInitials", "createdAt", "updatedAt") VALUES ('${id}', '${status}', '${chiefComplaint}', '${referredTo}', '${staffName}', '${now}', '${now}')`
    
    console.log('SQL:', sql)
    await p.$executeRawUnsafe(sql)

    // Verify
    const check = await p.$queryRawUnsafe(`SELECT id, status, "referredTo", "sentByNurseInitials", "createdAt" FROM consultations WHERE id = '${id}'`)

    return NextResponse.json({
      success: true,
      id,
      saved: Array.isArray(check) ? check[0] : check
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack })
  }
}

export async function GET() {
  try {
    const prisma = await getPrisma()
    if (!prisma) return NextResponse.json({ error: 'No database' })

    const p = prisma as any

    // Get all consultations with referredTo - cast bigint to text
    const all = await p.$queryRawUnsafe(`
      SELECT id, status, "referredTo"::text, "sentByNurseInitials"::text, "createdAt"::text
      FROM consultations
      ORDER BY "createdAt" DESC
      LIMIT 10
    `)

    // Count by referredTo - cast bigint
    const stats = await p.$queryRawUnsafe(`
      SELECT "referredTo"::text, COUNT(*)::text as count
      FROM consultations
      GROUP BY "referredTo"
    `)

    return NextResponse.json({ all, stats })

  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
