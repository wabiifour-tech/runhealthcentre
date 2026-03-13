// Medication Administration API
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('MedicationAdminAPI')

// GET - Fetch all medication administrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const administeredBy = searchParams.get('administeredBy')
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, administrations: [], mode: 'demo' })
    }

    const p = prisma as any
    
    let conditions = []
    if (patientId) conditions.push(`"patientId" = '${patientId}'`)
    if (administeredBy) conditions.push(`"administeredBy" = '${administeredBy}'`)
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'

    const administrations = await p.$queryRawUnsafe(`
      SELECT * FROM medication_administrations 
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT 200
    `)

    return NextResponse.json({ success: true, administrations: administrations || [] })
  } catch (error: any) {
    logger.error('Error fetching medication administrations', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Record medication administration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      patientId, patient, drugName, dosage, route, 
      administeredBy, administeredAt, notes, prescriptionId, consultationId
    } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const id = `medadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const adminTime = administeredAt || now

    await p.$executeRawUnsafe(`
      INSERT INTO medication_administrations (
        id, "patientId", patient, "drugName", dosage, route,
        "administeredBy", "administeredAt", notes, "createdAt"
      ) VALUES (
        '${id}',
        ${patientId ? `'${patientId}'` : 'NULL'},
        ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
        ${drugName ? `'${drugName.replace(/'/g, "''")}'` : 'NULL'},
        ${dosage ? `'${dosage.replace(/'/g, "''")}'` : 'NULL'},
        ${route ? `'${route}'` : 'NULL'},
        ${administeredBy ? `'${administeredBy}'` : 'NULL'},
        '${adminTime}',
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        '${now}'
      )
    `)

    logger.info('Medication administration recorded', { id, drugName, patientId })

    return NextResponse.json({ 
      success: true, 
      administration: { id, ...body, administeredAt: adminTime, createdAt: now } 
    })
  } catch (error: any) {
    logger.error('Error recording medication administration', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete medication administration record
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
      DELETE FROM medication_administrations WHERE id = '${id}'
    `)

    logger.info('Medication administration deleted', { id })

    return NextResponse.json({ success: true, message: 'Record deleted' })
  } catch (error: any) {
    logger.error('Error deleting medication administration', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
