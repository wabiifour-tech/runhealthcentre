// Comprehensive Data API for RUN Health Centre HMS
// Handles all data operations with PostgreSQL database
// Data is PERMANENTLY stored - never lost
import { NextRequest, NextResponse } from 'next/server'

// Try to get prisma client
async function getPrisma() {
  try {
    const dbModule = await import('@/lib/db')
    return dbModule.default
  } catch (e) {
    console.error('Database connection failed:', e)
    return null
  }
}

// GET - Fetch all data or specific type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection required. Please check DATABASE_URL environment variable.',
        hint: 'Data cannot be stored without a database connection.'
      }, { status: 503 })
    }

    // Access models via table names (Prisma 7.x with db pull schema)
    const p = prisma as any

    try {
      switch (type) {
        case 'patients':
          return NextResponse.json({ 
            success: true, 
            data: await p.patients.findMany({ orderBy: { registeredAt: 'desc' } }) 
          })

        case 'vitals':
          return NextResponse.json({ 
            success: true, 
            data: await p.vital_signs.findMany({ orderBy: { recordedAt: 'desc' } }) 
          })

        case 'consultations':
          return NextResponse.json({ 
            success: true, 
            data: await p.consultations.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'drugs':
          return NextResponse.json({ 
            success: true, 
            data: await p.drugs.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }) 
          })

        case 'labTests':
          return NextResponse.json({ 
            success: true, 
            data: await p.lab_tests.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }) 
          })

        case 'labRequests':
          return NextResponse.json({ 
            success: true, 
            data: await p.lab_requests.findMany({ orderBy: { requestedAt: 'desc' } }) 
          })

        case 'labResults':
          return NextResponse.json({ 
            success: true, 
            data: await p.lab_results.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'queueEntries':
          return NextResponse.json({ 
            success: true, 
            data: await p.queue_entries.findMany({ orderBy: { checkedInAt: 'desc' } }) 
          })

        case 'appointments':
          return NextResponse.json({ 
            success: true, 
            data: await p.appointments.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'admissions':
          return NextResponse.json({ 
            success: true, 
            data: await p.admissions.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'prescriptions':
          return NextResponse.json({ 
            success: true, 
            data: await p.prescriptions.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'medicalCertificates':
          return NextResponse.json({ 
            success: true, 
            data: await p.medical_certificates.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'referralLetters':
          return NextResponse.json({ 
            success: true, 
            data: await p.referral_letters.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'dischargeSummaries':
          return NextResponse.json({ 
            success: true, 
            data: await p.discharge_summaries.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'announcements':
          return NextResponse.json({ 
            success: true, 
            data: await p.announcements.findMany({ orderBy: { createdAt: 'desc' } }) 
          })

        case 'voiceNotes':
          return NextResponse.json({ 
            success: true, 
            data: await p.voice_notes.findMany({ orderBy: { createdAt: 'desc' } }) 
          })
        
        case 'dispensedDrugs':
          return NextResponse.json({ 
            success: true, 
            data: await p.dispensed_drugs.findMany({ orderBy: { dispensedAt: 'desc' } }) 
          })

        case 'auditLogs':
          return NextResponse.json({ 
            success: true, 
            data: await p.audit_logs.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }) 
          })

        case 'all': {
          const [patients, vitals, consultations, drugs, labTests, labRequests, labResults, 
                  queueEntries, appointments, admissions, prescriptions, medicalCertificates,
                  referralLetters, dischargeSummaries, announcements, voiceNotes, users, dispensedDrugs] = 
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
                select: { id: true, email: true, name: true, role: true, department: true, initials: true, isActive: true, isFirstLogin: true },
                orderBy: { createdAt: 'desc' }
              }),
              p.dispensed_drugs.findMany({ orderBy: { dispensedAt: 'desc' } })
            ])

          return NextResponse.json({ 
            success: true, 
            data: {
              patients, vitals, consultations, drugs, labTests, labRequests, labResults,
              queueEntries, appointments, admissions, prescriptions, medicalCertificates,
              referralLetters, dischargeSummaries, announcements, voiceNotes, users, dispensedDrugs
            }
          })
        }

        default:
          return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Database operation failed: ' + dbError.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new record - PERMANENT STORAGE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body
    const now = new Date().toISOString()
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection required. Data cannot be stored without a database.' 
      }, { status: 503 })
    }

    const p = prisma as any
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
          return NextResponse.json({ success: true, data: patient })
        }

        case 'vital': {
          const vital = await p.vital_signs.create({
            data: { ...data, recordedAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: vital })
        }

        case 'consultation': {
          const consultation = await p.consultations.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: consultation })
        }

        case 'drug': {
          const drug = await p.drugs.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: drug })
        }

        case 'labTest': {
          const labTest = await p.lab_tests.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: labTest })
        }

        case 'labRequest': {
          const labRequest = await p.lab_requests.create({
            data: { ...data, requestedAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: labRequest })
        }

        case 'labResult': {
          const labResult = await p.lab_results.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: labResult })
        }

        case 'queueEntry': {
          const queueEntry = await p.queue_entries.create({
            data: { ...data, checkedInAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: queueEntry })
        }

        case 'appointment': {
          const appointment = await p.appointments.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: appointment })
        }

        case 'admission': {
          const admission = await p.admissions.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: admission })
        }

        case 'prescription': {
          const prescription = await p.prescriptions.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: prescription })
        }

        case 'medicalCertificate': {
          const cert = await p.medical_certificates.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: cert })
        }

        case 'referralLetter': {
          const referral = await p.referral_letters.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: referral })
        }

        case 'dischargeSummary': {
          const discharge = await p.discharge_summaries.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: discharge })
        }

        case 'announcement': {
          const announcement = await p.announcements.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: announcement })
        }

        case 'voiceNote': {
          const voiceNote = await p.voice_notes.create({
            data: { ...data, createdAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: voiceNote })
        }

        case 'dispensedDrug': {
          const dispensedDrug = await p.dispensed_drugs.create({
            data: { ...data, dispensedAt: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: dispensedDrug })
        }

        case 'auditLog': {
          const auditLog = await p.audit_logs.create({
            data: { ...data, timestamp: now, id: generateId() }
          })
          return NextResponse.json({ success: true, data: auditLog })
        }

        default:
          return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save data: ' + dbError.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update record - PERMANENT STORAGE
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data } = body
    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection required. Data cannot be updated without a database.' 
      }, { status: 503 })
    }

    const p = prisma as any

    try {
      switch (type) {
        case 'patient': {
          const patient = await p.patients.update({
            where: { id },
            data: { ...data, lastEditedAt: new Date().toISOString() }
          })
          return NextResponse.json({ success: true, data: patient })
        }

        case 'vital': {
          const vital = await p.vital_signs.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: vital })
        }

        case 'consultation': {
          const consultation = await p.consultations.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: consultation })
        }

        case 'drug': {
          const drug = await p.drugs.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: drug })
        }

        case 'labRequest': {
          const labRequest = await p.lab_requests.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: labRequest })
        }

        case 'labResult': {
          const labResult = await p.lab_results.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: labResult })
        }

        case 'queueEntry': {
          const queueEntry = await p.queue_entries.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: queueEntry })
        }

        case 'appointment': {
          const appointment = await p.appointments.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: appointment })
        }

        case 'admission': {
          const admission = await p.admissions.update({
            where: { id },
            data: { ...data, updatedAt: new Date().toISOString() }
          })
          return NextResponse.json({ success: true, data: admission })
        }

        case 'prescription': {
          const prescription = await p.prescriptions.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: prescription })
        }

        case 'announcement': {
          const announcement = await p.announcements.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: announcement })
        }

        case 'voiceNote': {
          const voiceNote = await p.voice_notes.update({
            where: { id },
            data
          })
          return NextResponse.json({ success: true, data: voiceNote })
        }

        default:
          return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }
    } catch (dbError: any) {
      console.error('Database error in PUT:', dbError.message)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete record (soft delete for some types)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Type and ID required' }, { status: 400 })
    }

    const prisma = await getPrisma()

    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection required. Data cannot be deleted without a database.' 
      }, { status: 503 })
    }

    const p = prisma as any

    try {
      switch (type) {
        case 'patient':
          await p.patients.delete({ where: { id } })
          break
        case 'vital':
          await p.vital_signs.delete({ where: { id } })
          break
        case 'consultation':
          await p.consultations.delete({ where: { id } })
          break
        case 'drug':
          // Soft delete for drugs
          await p.drugs.update({ where: { id }, data: { isActive: false } })
          break
        case 'labTest':
          // Soft delete for lab tests
          await p.lab_tests.update({ where: { id }, data: { isActive: false } })
          break
        case 'labRequest':
          await p.lab_requests.delete({ where: { id } })
          break
        case 'labResult':
          await p.lab_results.delete({ where: { id } })
          break
        case 'queueEntry':
          await p.queue_entries.delete({ where: { id } })
          break
        case 'appointment':
          await p.appointments.delete({ where: { id } })
          break
        case 'admission':
          await p.admissions.delete({ where: { id } })
          break
        case 'prescription':
          await p.prescriptions.delete({ where: { id } })
          break
        case 'announcement':
          await p.announcements.delete({ where: { id } })
          break
        case 'voiceNote':
          await p.voice_notes.delete({ where: { id } })
          break
        default:
          return NextResponse.json({ success: false, error: 'Invalid data type' }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Deleted successfully' })
    } catch (dbError: any) {
      console.error('Database error in DELETE:', dbError.message)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
