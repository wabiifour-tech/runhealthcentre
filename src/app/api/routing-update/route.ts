import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, acknowledgedBy, completedBy, notes, purpose } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    // Get Prisma client
    const { getPrisma } = await import('@/lib/db')
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        message: 'Demo mode - no database connection',
        request: body 
      })
    }

    // Use explicit type casting for nullable parameters
    const statusValue = status || null
    const acknowledgedByValue = acknowledgedBy || null
    const completedByValue = completedBy || null
    const notesValue = notes || null
    const purposeValue = purpose || null

    // Execute update with Prisma's raw query
    const result = await prisma.$executeRaw`
      UPDATE routing_requests 
      SET 
        updated_at = NOW(),
        status = CASE WHEN ${statusValue}::TEXT IS NOT NULL THEN ${statusValue}::TEXT ELSE status END,
        acknowledged_at = CASE WHEN ${acknowledgedByValue}::TEXT IS NOT NULL THEN NOW() ELSE acknowledged_at END,
        acknowledged_by = CASE WHEN ${acknowledgedByValue}::TEXT IS NOT NULL THEN ${acknowledgedByValue}::TEXT ELSE acknowledged_by END,
        completed_at = CASE WHEN ${completedByValue}::TEXT IS NOT NULL THEN NOW() ELSE completed_at END,
        completed_by = CASE WHEN ${completedByValue}::TEXT IS NOT NULL THEN ${completedByValue}::TEXT ELSE completed_by END,
        notes = CASE WHEN ${notesValue}::TEXT IS NOT NULL THEN ${notesValue}::TEXT ELSE notes END,
        purpose = CASE WHEN ${purposeValue}::TEXT IS NOT NULL THEN ${purposeValue}::TEXT ELSE purpose END
      WHERE id = ${id}::TEXT
    `

    return NextResponse.json({ 
      success: true, 
      rowsAffected: result,
      message: result > 0 ? 'Routing request updated successfully' : 'No rows updated - request may not exist'
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
