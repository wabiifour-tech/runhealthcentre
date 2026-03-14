import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

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

// POST - Clear all patient-related data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action !== 'clear_all') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
    
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }

    const p = prisma as any
    
    console.log('[CLEANUP] Starting to clear all patient data...')
    
    // Delete in correct order (respecting foreign key constraints)
    const results = {
      consultations: 0,
      vital_signs: 0,
      lab_requests: 0,
      lab_results: 0,
      prescriptions: 0,
      dispensed_drugs: 0,
      queue_entries: 0,
      admissions: 0,
      medical_certificates: 0,
      referral_letters: 0,
      discharge_summaries: 0,
      routing_requests: 0,
      patients: 0,
      file_access_logs: 0
    }
    
    try {
      results.consultations = (await p.consultations.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.consultations} consultations`)
    } catch (e) { console.log('[CLEANUP] No consultations table') }
    
    try {
      results.vital_signs = (await p.vital_signs.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.vital_signs} vital signs`)
    } catch (e) { console.log('[CLEANUP] No vital_signs table') }
    
    try {
      results.lab_requests = (await p.lab_requests.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.lab_requests} lab requests`)
    } catch (e) { console.log('[CLEANUP] No lab_requests table') }
    
    try {
      results.lab_results = (await p.lab_results.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.lab_results} lab results`)
    } catch (e) { console.log('[CLEANUP] No lab_results table') }
    
    try {
      results.prescriptions = (await p.prescriptions.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.prescriptions} prescriptions`)
    } catch (e) { console.log('[CLEANUP] No prescriptions table') }
    
    try {
      results.queue_entries = (await p.queue_entries.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.queue_entries} queue entries`)
    } catch (e) { console.log('[CLEANUP] No queue_entries table') }
    
    try {
      results.admissions = (await p.admissions.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.admissions} admissions`)
    } catch (e) { console.log('[CLEANUP] No admissions table') }
    
    try {
      results.medical_certificates = (await p.medical_certificates.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.medical_certificates} medical certificates`)
    } catch (e) { console.log('[CLEANUP] No medical_certificates table') }
    
    try {
      results.referral_letters = (await p.referral_letters.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.referral_letters} referral letters`)
    } catch (e) { console.log('[CLEANUP] No referral_letters table') }
    
    try {
      results.discharge_summaries = (await p.discharge_summaries.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.discharge_summaries} discharge summaries`)
    } catch (e) { console.log('[CLEANUP] No discharge_summaries table') }
    
    try {
      results.routing_requests = (await p.$executeRawUnsafe(`DELETE FROM routing_requests`)) || 0
      console.log(`[CLEANUP] Deleted routing requests`)
    } catch (e) { console.log('[CLEANUP] No routing_requests table') }
    
    try {
      results.patients = (await p.patients.deleteMany({})).count || 0
      console.log(`[CLEANUP] Deleted ${results.patients} patients`)
    } catch (e) { console.log('[CLEANUP] No patients table') }
    
    const totalDeleted = Object.values(results).reduce((a: number, b: any) => a + (b || 0), 0)
    
    console.log(`[CLEANUP] Successfully cleared all patient data. Total records deleted: ${totalDeleted}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared all patient data`,
      details: results,
      totalDeleted
    })
  } catch (error: any) {
    console.error('Error clearing patient data:', error)
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
