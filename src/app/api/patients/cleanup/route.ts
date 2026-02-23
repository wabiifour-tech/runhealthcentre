import { NextRequest, NextResponse } from 'next/server'

// Try to get prisma client
async function getPrisma() {
  try {
    const dbModule = await import('@/lib/db')
    return dbModule.default
  } catch (e) {
    return null
  }
}

// GET - Find duplicate patients
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available'
      }, { status: 500 })
    }

    const p = prisma as any
    
    // Get all patients
    const patients = await p.patients.findMany()
    
    // Find duplicates by name + DOB or matric number
    const duplicates: any[] = []
    const seen = new Map<string, any>()

    for (const patient of patients) {
      if (!patient || !patient.firstName) continue
      
      // Create keys for comparison
      const nameDobKey = `${patient.firstName?.toLowerCase()?.trim()}_${patient.lastName?.toLowerCase()?.trim()}_${patient.dateOfBirth}`
      const matricKey = patient.matricNumber ? patient.matricNumber.toLowerCase().trim() : null
      const phoneKey = patient.phone ? patient.phone.trim() : null

      // Check for duplicates
      let isDuplicate = false
      let duplicateOf = null

      if (nameDobKey && seen.has(nameDobKey)) {
        isDuplicate = true
        duplicateOf = seen.get(nameDobKey)
      } else if (matricKey && seen.has(`matric_${matricKey}`)) {
        isDuplicate = true
        duplicateOf = seen.get(`matric_${matricKey}`)
      } else if (phoneKey && seen.has(`phone_${phoneKey}`)) {
        isDuplicate = true
        duplicateOf = seen.get(`phone_${phoneKey}`)
      }

      if (isDuplicate && duplicateOf) {
        duplicates.push({
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          ruhcCode: patient.ruhcCode,
          matricNumber: patient.matricNumber,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          registeredAt: patient.registeredAt,
          duplicateOf: {
            id: duplicateOf.id,
            name: `${duplicateOf.firstName} ${duplicateOf.lastName}`,
            ruhcCode: duplicateOf.ruhcCode
          }
        })
      } else {
        // Mark as seen
        if (nameDobKey) seen.set(nameDobKey, patient)
        if (matricKey) seen.set(`matric_${matricKey}`, patient)
        if (phoneKey) seen.set(`phone_${phoneKey}`, patient)
      }
    }

    return NextResponse.json({
      success: true,
      duplicates,
      totalPatients: patients.length,
      duplicateCount: duplicates.length
    })
  } catch (error: any) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete all patients or specific patients
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deleteAll = searchParams.get('all') === 'true'
    
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }

    const p = prisma as any

    if (deleteAll) {
      // Delete ALL patients
      const result = await p.patients.deleteMany({})
      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Successfully deleted all ${result.count} patient(s)`
      })
    }
    
    // Delete specific patients by IDs from body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Patient IDs required or use ?all=true' }, { status: 400 })
    }
    
    const { patientIds } = body

    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Patient IDs required or use ?all=true' }, { status: 400 })
    }

    const result = await p.patients.deleteMany({
      where: { id: { in: patientIds } }
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} patient(s)`
    })
  } catch (error: any) {
    console.error('Error deleting patients:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
