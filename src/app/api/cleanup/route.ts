import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'

const logger = createLogger('CleanupAPI')

// Helper to get prisma client
async function getPrisma() {
  try {
    const { getPrisma: getClient } = await import('@/lib/db')
    return await getClient()
  } catch (e) {
    logger.error('Failed to get Prisma client', { error: String(e) })
    return null
  }
}

// POST - Clear all data except SuperAdmin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, confirmToken } = body

    // Safety check - require confirmation token
    if (confirmToken !== 'RUHC-CLEANUP-2026') {
      return NextResponse.json({ error: 'Invalid confirmation token' }, { status: 403 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const p = prisma as any
    const results: Record<string, number> = {}

    if (action === 'clear_patients') {
      // Clear all patient-related data
      try {
        results.vitalSigns = await p.vital_signs.deleteMany({})
        results.consultations = await p.consultations.deleteMany({})
        results.labRequests = await p.lab_requests.deleteMany({})
        results.labResults = await p.lab_results.deleteMany({})
        results.prescriptions = await p.prescriptions.deleteMany({})
        results.queueEntries = await p.queue_entries.deleteMany({})
        results.appointments = await p.appointments.deleteMany({})
        results.admissions = await p.admissions.deleteMany({})
        results.medicalCertificates = await p.medical_certificates.deleteMany({})
        results.referralLetters = await p.referral_letters.deleteMany({})
        results.dischargeSummaries = await p.discharge_summaries.deleteMany({})
        results.patients = await p.patients.deleteMany({})
        logger.info('Cleared all patient data', results)
      } catch (e) {
        logger.error('Error clearing patient data', { error: String(e) })
      }
    }

    if (action === 'clear_staff') {
      // Clear all staff accounts except SUPER_ADMIN
      try {
        results.staff = await p.users.deleteMany({
          where: {
            NOT: {
              role: 'SUPER_ADMIN'
            }
          }
        })
        logger.info('Cleared all staff accounts except SUPER_ADMIN', results)
      } catch (e) {
        logger.error('Error clearing staff accounts', { error: String(e) })
      }
    }

    if (action === 'clear_all') {
      // Clear everything except SUPER_ADMIN
      try {
        results.vitalSigns = await p.vital_signs.deleteMany({})
        results.consultations = await p.consultations.deleteMany({})
        results.labRequests = await p.lab_requests.deleteMany({})
        results.labResults = await p.lab_results.deleteMany({})
        results.prescriptions = await p.prescriptions.deleteMany({})
        results.queueEntries = await p.queue_entries.deleteMany({})
        results.appointments = await p.appointments.deleteMany({})
        results.admissions = await p.admissions.deleteMany({})
        results.medicalCertificates = await p.medical_certificates.deleteMany({})
        results.referralLetters = await p.referral_letters.deleteMany({})
        results.dischargeSummaries = await p.discharge_summaries.deleteMany({})
        results.announcements = await p.announcements.deleteMany({})
        results.voiceNotes = await p.voice_notes.deleteMany({})
        results.rosters = await p.rosters.deleteMany({})
        results.attendance = await p.attendance.deleteMany({})
        results.patients = await p.patients.deleteMany({})
        results.staff = await p.users.deleteMany({
          where: {
            NOT: {
              role: 'SUPER_ADMIN'
            }
          }
        })
        logger.info('Cleared all data', results)
      } catch (e) {
        logger.error('Error clearing all data', { error: String(e) })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup action '${action}' completed`,
      results
    })

  } catch (error) {
    return errorResponse(error, { module: 'CleanupAPI', operation: 'cleanup' })
  }
}
