// Insurance Claims API - Prisma/SQLite Implementation
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, Errors } from '@/lib/errors'

const logger = createLogger('InsuranceClaimsAPI')

// GET - Fetch all insurance claims
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const claims = await p.insuranceClaims.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ success: true, claims, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error fetching insurance claims', { error: error.message })
    return errorResponse(error, { module: 'InsuranceClaims', operation: 'get' })
  }
}

// POST - Create new insurance claim
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { patientId, patient, enrolleeId, hmoId, claimType, services, totalAmount, diagnosis, icdCode, notes, createdBy } = body

    const id = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const claim = await p.insuranceClaims.create({
      data: {
        id,
        patientId,
        patient: patient || {},
        enrolleeId,
        hmoId,
        claimType,
        services: services || [],
        totalAmount,
        diagnosis,
        icdCode,
        notes,
        createdBy,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
    })

    logger.info('Insurance claim created', { id })

    // Create notification (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'insurance_claim', title: 'New Insurance Claim',
        message: `New insurance claim created for ${patient?.name || 'patient'}`,
        targetRoles: ['ADMIN', 'SUPER_ADMIN'], priority: 'normal', data: { claimId: id, patientId }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, claim: { id, ...body, status: 'draft', createdAt: now }, method: 'prisma' })

  } catch (error: any) {
    logger.error('Error creating insurance claim', { error: error.message })
    return errorResponse(error, { module: 'InsuranceClaims', operation: 'create' })
  }
}

// PUT - Update insurance claim status
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }
    const p = prisma as any

    const body = await request.json()
    const { id, status, approvedAmount, rejectionReason, processedBy, notes } = body

    if (!id) {
      throw Errors.validation('Claim ID required')
    }

    const now = new Date().toISOString()

    const updateData: any = { updatedAt: now }
    if (status !== undefined) updateData.status = status
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason
    if (processedBy !== undefined) updateData.processedBy = processedBy
    if (notes !== undefined) updateData.notes = notes
    
    // Set processedAt when status is approved or rejected
    if (status === 'approved' || status === 'rejected') {
      updateData.processedAt = now
    }

    await p.insuranceClaims.update({
      where: { id },
      data: updateData
    })

    logger.info('Insurance claim updated', { id, status })
    return NextResponse.json({ success: true, message: 'Claim updated successfully', method: 'prisma' })

  } catch (error: any) {
    logger.error('Error updating insurance claim', { error: error.message })
    return errorResponse(error, { module: 'InsuranceClaims', operation: 'update' })
  }
}
