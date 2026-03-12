// Insurance Claims API
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('InsuranceClaimsAPI')

// GET - Fetch all insurance claims
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, claims: [], mode: 'demo' })
    }

    const p = prisma as any
    
    let whereClause = '1=1'
    if (status) {
      whereClause = `status = '${status}'`
    }

    const claims = await p.$queryRawUnsafe(`
      SELECT * FROM insurance_claims 
      WHERE ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT 100
    `)

    return NextResponse.json({ success: true, claims: claims || [] })
  } catch (error: any) {
    logger.error('Error fetching insurance claims', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new insurance claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patient, enrolleeId, hmoId, claimType, services, totalAmount, diagnosis, icdCode, notes, createdBy } = body

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const id = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      INSERT INTO insurance_claims (
        id, "patientId", patient, "enrolleeId", "hmoId", "claimType", services, 
        "totalAmount", diagnosis, "icdCode", notes, "createdBy", status, "createdAt", "updatedAt"
      ) VALUES (
        '${id}',
        ${patientId ? `'${patientId}'` : 'NULL'},
        ${patient ? `'${JSON.stringify(patient).replace(/'/g, "''")}'` : 'NULL'},
        ${enrolleeId ? `'${enrolleeId}'` : 'NULL'},
        ${hmoId ? `'${hmoId}'` : 'NULL'},
        ${claimType ? `'${claimType}'` : 'NULL'},
        ${services ? `'${JSON.stringify(services).replace(/'/g, "''")}'` : 'NULL'},
        ${totalAmount || 'NULL'},
        ${diagnosis ? `'${diagnosis.replace(/'/g, "''")}'` : 'NULL'},
        ${icdCode ? `'${icdCode}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        ${createdBy ? `'${createdBy}'` : 'NULL'},
        'draft',
        '${now}',
        '${now}'
      )
    `)

    logger.info('Insurance claim created', { id })

    // Create notification for admin
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'insurance_claim',
          title: 'New Insurance Claim',
          message: `New insurance claim created for ${patient?.name || 'patient'}`,
          targetRoles: ['ADMIN', 'SUPER_ADMIN'],
          priority: 'normal',
          data: { claimId: id, patientId }
        })
      })
    } catch {}

    return NextResponse.json({ success: true, claim: { id, ...body, status: 'draft', createdAt: now } })
  } catch (error: any) {
    logger.error('Error creating insurance claim', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update insurance claim status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, approvedAmount, rejectionReason, processedBy, notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Claim ID required' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any
    const now = new Date().toISOString()

    await p.$executeRawUnsafe(`
      UPDATE insurance_claims 
      SET 
        status = ${status ? `'${status}'` : 'status'},
        "approvedAmount" = ${approvedAmount || 'NULL'},
        "rejectionReason" = ${rejectionReason ? `'${rejectionReason.replace(/'/g, "''")}'` : 'NULL'},
        "processedBy" = ${processedBy ? `'${processedBy}'` : 'NULL'},
        "processedAt" = ${status === 'approved' || status === 'rejected' ? `'${now}'` : 'NULL'},
        notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'notes'},
        "updatedAt" = '${now}'
      WHERE id = '${id}'
    `)

    logger.info('Insurance claim updated', { id, status })

    return NextResponse.json({ success: true, message: 'Claim updated successfully' })
  } catch (error: any) {
    logger.error('Error updating insurance claim', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
