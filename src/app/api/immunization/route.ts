// Immunization Records API
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ImmunizationAPI')

// GET - Fetch immunization records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const vaccineName = searchParams.get('vaccineName')
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, records: [], mode: 'demo' })
    }

    const p = prisma as any
    
    let conditions = []
    if (patientId) conditions.push(`"patientId" = '${patientId}'`)
    if (vaccineName) conditions.push(`"vaccineName" ILIKE '%${vaccineName}%'`)
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'

    const records = await p.$queryRawUnsafe(`
      SELECT * FROM immunization_records 
      WHERE ${whereClause}
      ORDER BY "administeredAt" DESC
      LIMIT 200
    `)

    return NextResponse.json({ success: true, records: records || [] })
  } catch (error: any) {
    logger.error('Error fetching immunization records', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new immunization record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      patientId, patient, vaccineName, doseNumber, batchNumber,
      administeredBy, administeredAt, nextDoseDate, reactions, notes
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const id = `imm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const adminTime = administeredAt || now

    await p.$executeRawUnsafe(`
      INSERT INTO immunization_records (
        id, "patientId", patient, "vaccineName", "doseNumber", "batchNumber",
        "administeredBy", "administeredAt", "nextDoseDate", reactions, notes, "createdAt"
      ) VALUES (
        '${id}',
        ${patientId ? `'${patientId}'` : 'NULL'},
        ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
        ${vaccineName ? `'${vaccineName.replace(/'/g, "''")}'` : 'NULL'},
        ${doseNumber || 'NULL'},
        ${batchNumber ? `'${batchNumber}'` : 'NULL'},
        ${administeredBy ? `'${administeredBy}'` : 'NULL'},
        '${adminTime}',
        ${nextDoseDate ? `'${nextDoseDate}'` : 'NULL'},
        ${reactions ? `'${reactions.replace(/'/g, "''")}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        '${now}'
      )
    `)

    logger.info('Immunization record created', { id, vaccineName, patientId })

    // If there's a next dose date, create a patient task reminder
    if (nextDoseDate) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patient-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            patient,
            taskId: 'vaccination_reminder',
            taskName: `${vaccineName} Dose ${doseNumber + 1} Reminder`,
            scheduledTime: nextDoseDate,
            priority: 'routine',
            notes: `Follow-up vaccination for ${vaccineName}`,
            assignedBy: administeredBy
          })
        })
      } catch {}
    }

    return NextResponse.json({ 
      success: true, 
      record: { id, ...body, administeredAt: adminTime, createdAt: now } 
    })
  } catch (error: any) {
    logger.error('Error creating immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete immunization record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any

    await p.$executeRawUnsafe(`
      DELETE FROM immunization_records WHERE id = '${id}'
    `)

    logger.info('Immunization record deleted', { id })

    return NextResponse.json({ success: true, message: 'Record deleted' })
  } catch (error: any) {
    logger.error('Error deleting immunization record', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
