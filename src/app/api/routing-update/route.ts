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

    // Execute update
    const result = await prisma.$executeRaw`
      UPDATE routing_requests 
      SET 
        updated_at = NOW(),
        status = COALESCE(${status}, status),
        acknowledged_at = CASE WHEN ${acknowledgedBy} IS NOT NULL THEN NOW() ELSE acknowledged_at END,
        acknowledged_by = COALESCE(${acknowledgedBy}, acknowledged_by),
        completed_at = CASE WHEN ${completedBy} IS NOT NULL THEN NOW() ELSE completed_at END,
        completed_by = COALESCE(${completedBy}, completed_by),
        notes = COALESCE(${notes}, notes),
        purpose = COALESCE(${purpose}, purpose)
      WHERE id = ${id}
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
