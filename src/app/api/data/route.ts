// Comprehensive Data API for RUN Health Centre HMS
// Handles all data operations with Neon PostgreSQL database
// Falls back to demo mode when database is not available
import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('DataAPI')

// Real-time broadcast helper
async function broadcastChange(eventType: string, dataType: string, data?: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: eventType, 
        data: { type: dataType, item: data, timestamp: Date.now() }
      })
    })
  } catch (e) {
    // Silent fail - don't break operations if broadcast fails
    logger.debug('Broadcast failed', { error: String(e) })
  }
}

// In-memory data store for demo mode
const demoData: Record<string, any[]> = {
  patients: [],
  vitals: [],
  consultations: [],
  drugs: [],
  labTests: [],
  labRequests: [],
  labResults: [],
  queueEntries: [],
  appointments: [],
  admissions: [],
  prescriptions: [],
  medicalCertificates: [],
  referralLetters: [],
  dischargeSummaries: [],
  announcements: [],
  voiceNotes: [],
  auditLogs: [],
  rosters: [],
  attendance: [],
  users: []
}

// Try to get prisma client
async function getPrisma() {
  try {
    const { getPrisma: getClient } = await import('@/lib/db')
    return await getClient()
  } catch (e) {
    logger.error('Failed to get Prisma client', { error: String(e) })
    return null
  }
}

// GET - Fetch all data or specific type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const prisma = await getPrisma()

    // If no database or demo mode, return empty/demo data
    if (!prisma) {
      return handleDemoGet(type)
    }

    // Access models via table names (Prisma 7.x with db pull schema)
    const p = prisma as any

    try {
      switch (type) {
        case 'patients':
          return successResponse({ 
            data: await p.patients.findMany({ orderBy: { registeredAt: 'desc' } }) 
          })

        case 'vitals':
          return successResponse({ 
            data: await p.vital_signs.findMany({ orderBy: { recordedAt: 'desc' } }) 
          })

        case 'consultations':
          return successResponse({ 
            data: await p.consultations.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'drugs':
          return successResponse({ 
            data: await p.drugs.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }) 
          })

        case 'labTests':
          return successResponse({ 
            data: await p.lab_tests.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }) 
          })

        case 'labRequests':
          return successResponse({ 
            data: await p.lab_requests.findMany({ orderBy: { requestedAt: 'desc' } }) 
          })

        case 'labResults':
          return successResponse({ 
            data: await p.lab_results.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'queueEntries':
          return successResponse({ 
            data: await p.queue_entries.findMany({ orderBy: { checkedInAt: 'desc' } }) 
          })

        case 'appointments':
          return successResponse({ 
            data: await p.appointments.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'admissions':
          return successResponse({ 
            data: await p.admissions.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'prescriptions':
          return successResponse({ 
            data: await p.prescriptions.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'medicalCertificates':
          return successResponse({ 
            data: await p.medical_certificates.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'referralLetters':
          return successResponse({ 
            data: await p.referral_letters.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'dischargeSummaries':
          return successResponse({ 
            data: await p.discharge_summaries.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'announcements':
          return successResponse({ 
            data: await p.announcements.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'voiceNotes':
          return successResponse({ 
            data: await p.voice_notes.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'auditLogs':
          return successResponse({ 
            data: await p.audit_logs.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }) 
          })

        case 'rosters':
          return successResponse({ 
            data: await p.rosters.findMany({ orderBy: { date: 'desc' } }) 
          })

        case 'attendance':
          return successResponse({ 
            data: await p.attendance.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'all': {
          const [patients, vitals, consultations, drugs, labTests, labRequests, labResults, 
                  queueEntries, appointments, admissions, prescriptions, medicalCertificates,
                  referralLetters, dischargeSummaries, announcements, voiceNotes, users, rosters, attendance] = 
            await Promise.all([
              p.patients.findMany({ orderBy: { registeredAt: 'desc' } }),
              p.vital_signs.findMany({ orderBy: { recordedAt: 'desc' } }),
              p.consultations.findMany({ orderBy: { createdAt: 'desc' } }),
              p.drugs.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
              p.lab_tests.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
              p.lab_requests.findMany({ orderBy: { requestedAt: 'desc' } }),
              p.lab_results.findMany({ orderBy: { createdAt: 'desc' } }),
              p.queue_entries.findMany({ orderBy: { checkedInAt: 'desc' } }),
              p.appointments.findMany({ orderBy: { createdAt: 'desc' } }),
              p.admissions.findMany({ orderBy: { createdAt: 'desc' } }),
              p.prescriptions.findMany({ orderBy: { createdAt: 'desc' } }),
              p.medical_certificates.findMany({ orderBy: { createdAt: 'desc' } }),
              p.referral_letters.findMany({ orderBy: { createdAt: 'desc' } }),
              p.discharge_summaries.findMany({ orderBy: { createdAt: 'desc' } }),
              p.announcements.findMany({ orderBy: { createdAt: 'desc' } }),
              p.voice_notes.findMany({ orderBy: { createdAt: 'desc' } }),
              p.users.findMany({
                select: { id: true, email: true, name: true, role: true, department: true, initials: true, isActive: true, isFirstLogin: true, profilePhoto: true, approvalStatus: true, createdAt: true, phone: true, dateOfBirth: true },
                orderBy: { createdAt: 'desc' }
              }),
              p.rosters.findMany({ orderBy: { date: 'desc' } }),
              p.attendance.findMany({ orderBy: { createdAt: 'desc' } })
            ])

          logger.debug('Fetched all data', { patientCount: patients.length })
          return successResponse({ 
            data: {
              patients, vitals, consultations, drugs, labTests, labRequests, labResults,
              queueEntries, appointments, admissions, prescriptions, medicalCertificates,
              referralLetters, dischargeSummaries, announcements, voiceNotes, users, rosters, attendance
            }
          })
        }

        default:
          throw Errors.validation('Invalid data type')
      }
    } catch (dbError: any) {
      // Re-throw API errors
      if (dbError.name === 'ApiError') throw dbError
      logger.warn('Database error, using demo mode', { error: dbError.message })
      return handleDemoGet(type)
    }
  } catch (error) {
    return errorResponse(error, { module: 'DataAPI', operation: 'get' })
  }
}

function handleDemoGet(type: string) {
  if (type === 'all') {
    return successResponse({ 
      data: demoData,
      mode: 'demo'
    })
  }
  
  const key = type === 'labTests' ? 'labTests' : 
              type === 'labRequests' ? 'labRequests' :
              type === 'labResults' ? 'labResults' :
              type === 'queueEntries' ? 'queueEntries' :
              type === 'medicalCertificates' ? 'medicalCertificates' :
              type === 'referralLetters' ? 'referralLetters' :
              type === 'dischargeSummaries' ? 'dischargeSummaries' :
              type === 'voiceNotes' ? 'voiceNotes' :
              type === 'auditLogs' ? 'auditLogs' : type
  
  return successResponse({ 
    data: demoData[key] || [],
    mode: 'demo'
  })
}

// POST - Create new record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body
    const now = new Date().toISOString()
    const prisma = await getPrisma()

    // Generate ID for demo mode
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // If no database, use demo mode
    if (!prisma) {
      return handleDemoPost(type, data, now, generateId)
    }

    const p = prisma as any

    try {
      switch (type) {
        case 'patient': {
          const count = await p.patients.count()
          const hospitalNumber = `HN${String(count + 1).padStart(6, '0')}`
          const ruhcCode = `RUHC-${String(count + 1).padStart(6, '0')}`

          const patient = await p.patients.create({
            data: {
              ...data,
              hospitalNumber,
              ruhcCode,
              registeredAt: now,
              id: generateId()
            }
          })
          logger.info('Patient created', { hospitalNumber, ruhcCode })
          // Broadcast to all connected clients
          broadcastChange('patient_created', 'patient', patient)
          return successResponse({ data: patient })
        }

        case 'vital': {
          const vital = await p.vital_signs.create({
            data: { ...data, recordedAt: now, id: generateId() }
          })
          logger.info('Vital signs recorded', { patientId: data.patientId })
          broadcastChange('vital_created', 'vital', vital)
          return successResponse({ data: vital })
        }

        case 'consultation': {
          const consultation = await p.consultations.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Consultation created', { patientId: data.patientId })
          broadcastChange('consultation_created', 'consultation', consultation)
          return successResponse({ data: consultation })
        }

        case 'drug': {
          const drug = await p.drugs.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Drug added', { name: data.name })
          broadcastChange('drug_created', 'drug', drug)
          return successResponse({ data: drug })
        }

        case 'labTest': {
          const labTest = await p.lab_tests.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Lab test added', { name: data.name })
          broadcastChange('labTest_created', 'labTest', labTest)
          return successResponse({ data: labTest })
        }

        case 'labRequest': {
          const labRequest = await p.lab_requests.create({
            data: { ...data, requestedAt: now, id: generateId() }
          })
          logger.info('Lab request created', { patientId: data.patientId })
          broadcastChange('labRequest_created', 'labRequest', labRequest)
          return successResponse({ data: labRequest })
        }

        case 'labResult': {
          const labResult = await p.lab_results.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Lab result added', { requestId: data.requestId })
          broadcastChange('labResult_created', 'labResult', labResult)
          return successResponse({ data: labResult })
        }

        case 'queueEntry': {
          const queueEntry = await p.queue_entries.create({
            data: { ...data, checkedInAt: now, id: generateId() }
          })
          logger.info('Queue entry created', { patientId: data.patientId })
          broadcastChange('queueEntry_created', 'queueEntry', queueEntry)
          return successResponse({ data: queueEntry })
        }

        case 'appointment': {
          const appointment = await p.appointments.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Appointment created', { patientId: data.patientId })
          broadcastChange('appointment_created', 'appointment', appointment)
          return successResponse({ data: appointment })
        }

        case 'admission': {
          const admission = await p.admissions.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Admission created', { patientId: data.patientId })
          broadcastChange('admission_created', 'admission', admission)
          return successResponse({ data: admission })
        }

        case 'prescription': {
          const prescription = await p.prescriptions.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Prescription created', { patientId: data.patientId })
          broadcastChange('prescription_created', 'prescription', prescription)
          return successResponse({ data: prescription })
        }

        case 'medicalCertificate': {
          const cert = await p.medical_certificates.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Medical certificate created', { patientId: data.patientId })
          broadcastChange('medicalCertificate_created', 'medicalCertificate', cert)
          return successResponse({ data: cert })
        }

        case 'referralLetter': {
          const referral = await p.referral_letters.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Referral letter created', { patientId: data.patientId })
          broadcastChange('referralLetter_created', 'referralLetter', referral)
          return successResponse({ data: referral })
        }

        case 'dischargeSummary': {
          const discharge = await p.discharge_summaries.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Discharge summary created', { patientId: data.patientId })
          broadcastChange('dischargeSummary_created', 'dischargeSummary', discharge)
          return successResponse({ data: discharge })
        }

        case 'announcement': {
          const announcement = await p.announcements.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Announcement created', { title: data.title })
          broadcastChange('announcement_created', 'announcement', announcement)
          return successResponse({ data: announcement })
        }

        case 'voiceNote': {
          const voiceNote = await p.voice_notes.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Voice note created', { patientId: data.patientId })
          broadcastChange('voiceNote_created', 'voiceNote', voiceNote)
          return successResponse({ data: voiceNote })
        }

        case 'auditLog': {
          const auditLog = await p.audit_logs.create({
            data: { ...data, timestamp: now, id: generateId() }
          })
          return successResponse({ data: auditLog })
        }

        case 'roster': {
          const roster = await p.rosters.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Roster created', { staffId: data.staffId })
          broadcastChange('roster_created', 'roster', roster)
          return successResponse({ data: roster })
        }

        case 'attendance': {
          const attendanceRecord = await p.attendance.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          logger.info('Attendance recorded', { staffId: data.staffId })
          broadcastChange('attendance_created', 'attendance', attendanceRecord)
          return successResponse({ data: attendanceRecord })
        }

        default:
          throw Errors.validation('Invalid data type')
      }
    } catch (dbError: any) {
      // Re-throw API errors
      if (dbError.name === 'ApiError') throw dbError
      logger.warn('Database error, using demo mode', { error: dbError.message })
      return handleDemoPost(type, data, now, generateId)
    }
  } catch (error) {
    return errorResponse(error, { module: 'DataAPI', operation: 'create' })
  }
}

function handleDemoPost(type: string, data: any, now: string, generateId: () => string) {
  const key = type === 'labTest' ? 'labTests' : 
              type === 'labRequest' ? 'labRequests' :
              type === 'labResult' ? 'labResults' :
              type === 'queueEntry' ? 'queueEntries' :
              type === 'medicalCertificate' ? 'medicalCertificates' :
              type === 'referralLetter' ? 'referralLetters' :
              type === 'dischargeSummary' ? 'dischargeSummaries' :
              type === 'voiceNote' ? 'voiceNotes' :
              type === 'auditLog' ? 'auditLogs' :
              type === 'seedDrugs' ? 'drugs' :
              type === 'seedLabTests' ? 'labTests' : type

  if (type === 'seedDrugs' || type === 'seedLabTests') {
    const items = data.drugs || data.tests || []
    items.forEach((item: any) => {
      demoData[key].push({ ...item, id: generateId(), createdAt: now })
    })
    logger.info('Seeded data', { type, count: items.length })
    return successResponse({ message: `Created ${items.length} items`, mode: 'demo' })
  }

  const newRecord = {
    ...data,
    id: generateId(),
    createdAt: now,
    registeredAt: now,
    recordedAt: now,
    requestedAt: now,
    checkedInAt: now,
    timestamp: now
  }

  if (demoData[key]) {
    demoData[key].push(newRecord)
  }

  logger.debug('Demo record created', { type, id: newRecord.id })
  return successResponse({ data: newRecord, mode: 'demo' })
}

// PUT - Update record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data } = body
    const prisma = await getPrisma()

    if (!prisma) {
      // Demo mode - find and update in memory
      const key = type === 'labRequest' ? 'labRequests' :
                  type === 'labResult' ? 'labResults' :
                  type === 'queueEntry' ? 'queueEntries' :
                  type === 'medicalCertificate' ? 'medicalCertificates' :
                  type === 'referralLetter' ? 'referralLetters' :
                  type === 'dischargeSummary' ? 'dischargeSummaries' :
                  type === 'voiceNote' ? 'voiceNotes' : type
      
      const index = demoData[key]?.findIndex((item: any) => item.id === id)
      if (index !== undefined && index >= 0) {
        demoData[key][index] = { ...demoData[key][index], ...data }
        return successResponse({ data: demoData[key][index], mode: 'demo' })
      }
      throw Errors.notFound('Record')
    }

    const p = prisma as any

    try {
      switch (type) {
        case 'patient': {
          const patient = await p.patients.update({
            where: { id },
            data: { ...data, lastEditedAt: new Date().toISOString() }
          })
          logger.info('Patient updated', { patientId: id })
          broadcastChange('patient_updated', 'patient', patient)
          return successResponse({ data: patient })
        }

        case 'vital': {
          const vital = await p.vital_signs.update({
            where: { id },
            data
          })
          broadcastChange('vital_updated', 'vital', vital)
          return successResponse({ data: vital })
        }

        case 'consultation': {
          const consultation = await p.consultations.update({
            where: { id },
            data
          })
          logger.info('Consultation updated', { consultationId: id })
          broadcastChange('consultation_updated', 'consultation', consultation)
          return successResponse({ data: consultation })
        }

        case 'drug': {
          const drug = await p.drugs.update({
            where: { id },
            data
          })
          broadcastChange('drug_updated', 'drug', drug)
          return successResponse({ data: drug })
        }

        case 'labRequest': {
          const labRequest = await p.lab_requests.update({
            where: { id },
            data
          })
          logger.info('Lab request updated', { requestId: id })
          broadcastChange('labRequest_updated', 'labRequest', labRequest)
          return successResponse({ data: labRequest })
        }

        case 'labResult': {
          const labResult = await p.lab_results.update({
            where: { id },
            data
          })
          broadcastChange('labResult_updated', 'labResult', labResult)
          return successResponse({ data: labResult })
        }

        case 'queueEntry': {
          const queueEntry = await p.queue_entries.update({
            where: { id },
            data
          })
          broadcastChange('queueEntry_updated', 'queueEntry', queueEntry)
          return successResponse({ data: queueEntry })
        }

        case 'appointment': {
          const appointment = await p.appointments.update({
            where: { id },
            data
          })
          logger.info('Appointment updated', { appointmentId: id })
          broadcastChange('appointment_updated', 'appointment', appointment)
          return successResponse({ data: appointment })
        }

        case 'admission': {
          const admission = await p.admissions.update({
            where: { id },
            data: { ...data, updatedAt: new Date().toISOString() }
          })
          logger.info('Admission updated', { admissionId: id })
          broadcastChange('admission_updated', 'admission', admission)
          return successResponse({ data: admission })
        }

        case 'prescription': {
          const prescription = await p.prescriptions.update({
            where: { id },
            data
          })
          broadcastChange('prescription_updated', 'prescription', prescription)
          return successResponse({ data: prescription })
        }

        case 'announcement': {
          const announcement = await p.announcements.update({
            where: { id },
            data
          })
          broadcastChange('announcement_updated', 'announcement', announcement)
          return successResponse({ data: announcement })
        }

        case 'voiceNote': {
          const voiceNote = await p.voice_notes.update({
            where: { id },
            data
          })
          return successResponse({ data: voiceNote })
        }

        default:
          throw Errors.validation('Invalid data type')
      }
    } catch (dbError: any) {
      if (dbError.name === 'ApiError') throw dbError
      logger.error('Database error in PUT', { error: dbError.message })
      throw Errors.database('Update failed')
    }
  } catch (error) {
    return errorResponse(error, { module: 'DataAPI', operation: 'update' })
  }
}

// DELETE - Delete record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      throw Errors.validation('Type and ID are required')
    }

    const prisma = await getPrisma()

    if (!prisma) {
      // Demo mode - remove from memory
      const key = type === 'labRequest' ? 'labRequests' :
                  type === 'labResult' ? 'labResults' :
                  type === 'queueEntry' ? 'queueEntries' :
                  type === 'voiceNote' ? 'voiceNotes' :
                  type === 'labTest' ? 'labTests' :
                  type === 'medicalCertificate' ? 'medicalCertificates' :
                  type === 'referralLetter' ? 'referralLetters' :
                  type === 'dischargeSummary' ? 'dischargeSummaries' : type
      
      const index = demoData[key]?.findIndex((item: any) => item.id === id)
      if (index !== undefined && index >= 0) {
        demoData[key].splice(index, 1)
      }
      return successResponse({ message: 'Deleted successfully', mode: 'demo' })
    }

    const p = prisma as any

    try {
      switch (type) {
        case 'patient':
          await p.patients.delete({ where: { id } })
          logger.info('Patient deleted', { patientId: id })
          broadcastChange('patient_deleted', 'patient', { id })
          break
        case 'vital':
          await p.vital_signs.delete({ where: { id } })
          broadcastChange('vital_deleted', 'vital', { id })
          break
        case 'consultation':
          await p.consultations.delete({ where: { id } })
          broadcastChange('consultation_deleted', 'consultation', { id })
          break
        case 'drug':
          await p.drugs.update({ where: { id }, data: { isActive: false } })
          logger.info('Drug deactivated', { drugId: id })
          broadcastChange('drug_deleted', 'drug', { id })
          break
        case 'labTest':
          await p.lab_tests.update({ where: { id }, data: { isActive: false } })
          broadcastChange('labTest_deleted', 'labTest', { id })
          break
        case 'labRequest':
          await p.lab_requests.delete({ where: { id } })
          broadcastChange('labRequest_deleted', 'labRequest', { id })
          break
        case 'labResult':
          await p.lab_results.delete({ where: { id } })
          broadcastChange('labResult_deleted', 'labResult', { id })
          break
        case 'queueEntry':
          await p.queue_entries.delete({ where: { id } })
          broadcastChange('queueEntry_deleted', 'queueEntry', { id })
          break
        case 'appointment':
          await p.appointments.delete({ where: { id } })
          logger.info('Appointment deleted', { appointmentId: id })
          broadcastChange('appointment_deleted', 'appointment', { id })
          break
        case 'admission':
          await p.admissions.delete({ where: { id } })
          broadcastChange('admission_deleted', 'admission', { id })
          break
        case 'prescription':
          await p.prescriptions.delete({ where: { id } })
          broadcastChange('prescription_deleted', 'prescription', { id })
          break
        case 'announcement':
          await p.announcements.delete({ where: { id } })
          broadcastChange('announcement_deleted', 'announcement', { id })
          break
        case 'voiceNote':
          await p.voice_notes.delete({ where: { id } })
          broadcastChange('voiceNote_deleted', 'voiceNote', { id })
          break
        case 'medicalCertificate':
          await p.medical_certificates.delete({ where: { id } })
          broadcastChange('medicalCertificate_deleted', 'medicalCertificate', { id })
          break
        case 'referralLetter':
          await p.referral_letters.delete({ where: { id } })
          break
        case 'dischargeSummary':
          await p.discharge_summaries.delete({ where: { id } })
          break
        default:
          throw Errors.validation('Invalid data type')
      }

      return successResponse({ message: 'Deleted successfully' })
    } catch (dbError: any) {
      if (dbError.name === 'ApiError') throw dbError
      logger.error('Database error in DELETE', { error: dbError.message })
      throw Errors.database('Delete failed')
    }
  } catch (error) {
    return errorResponse(error, { module: 'DataAPI', operation: 'delete' })
  }
}
