// Medication Administration API - Prisma/SQLite Implementation
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('MedicationAdminAPI')

// GET - Fetch all medication administrations
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const administeredBy = searchParams.get('administeredBy')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (administeredBy) where.administeredBy = administeredBy

    const administrations = await p.medicationAdministrations.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    return NextResponse.json({ success: true, administrations, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error fetching medication administrations', { error: error.message })
    return errorResponse(error, { module: 'MedicationAdmin', operation: 'get' })
  }
}

// POST - Record medication administration
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { patientId, patient, drugName, dosage, route, administeredBy, administeredAt, notes, prescriptionId, consultationId } = body

    const id = `medadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const adminTime = administeredAt || now

    const administration = await p.medicationAdministrations.create({
      data: {
        id,
        patientId,
        patient: patient || {},
        drugName,
        dosage,
        route,
        administeredBy,
        administeredAt: adminTime,
        notes,
        createdAt: now
      }
    })

    logger.info('Medication administration recorded', { id, drugName, patientId })
    return NextResponse.json({ success: true, administration: { id, ...body, administeredAt: adminTime, createdAt: now }, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error recording medication administration', { error: error.message })
    return errorResponse(error, { module: 'MedicationAdmin', operation: 'create' })
  }
}

// DELETE - Delete medication administration record
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw Errors.validation('ID required')
    }

    await p.medicationAdministrations.delete({
      where: { id }
    })

    logger.info('Medication administration deleted', { id })
    return NextResponse.json({ success: true, message: 'Record deleted', method: 'prisma' })

  } catch (error: any) {
    logger.error('Error deleting medication administration', { error: error.message })
    return errorResponse(error, { module: 'MedicationAdmin', operation: 'delete' })
  }
}
