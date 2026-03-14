// Comprehensive Data API for Redeemer's University Health Centre (RUHC) HMS
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
  users: [],
  // New data types
  bills: [],
  payments: [],
  expenses: [],
  inventoryItems: [],
  equipment: [],
  patientWallets: [],
  insuranceClaims: [],
  bloodDonors: [],
  bloodUnits: [],
  medicalAssets: [],
  surgeryBookings: [],
  immunizationRecords: [],
  antenatalVisits: [],
  patientTasks: [],
  staffAttendances: [],
  shiftSwaps: [],
  certifications: [],
  trainingRecords: [],
  medicationAdmins: [],
  ambulanceCalls: [],
  routingRequests: []
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

// Ensure required columns exist in consultations table
let schemaChecked = false
async function ensureConsultationSchema(prisma: any) {
  if (schemaChecked) return
  schemaChecked = true
  
  try {
    // Add referredTo column if missing
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'referredTo') THEN
          ALTER TABLE consultations ADD COLUMN "referredTo" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'sentByNurseInitials') THEN
          ALTER TABLE consultations ADD COLUMN "sentByNurseInitials" TEXT;
        END IF;
      END $$;
    `)
    logger.info('Consultation schema verified')
  } catch (e) {
    logger.debug('Schema check completed', { error: String(e) })
  }
}

// Helper function to escape SQL values
const escapeVal = (val: any) => val ? String(val).replace(/'/g, "''") : null

// Helper to create table if not exists for new data types
async function ensureTableExists(prisma: any, tableName: string, createSQL: string) {
  try {
    await prisma.$executeRawUnsafe(createSQL)
  } catch (e) {
    // Table might already exist
    logger.debug(`Table ${tableName} check completed`, { error: String(e) })
  }
}

// Table creation SQL for new data types
const TABLE_CREATE_SQL: Record<string, string> = {
  bills: `CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "billNumber" TEXT,
    "billType" TEXT,
    items JSON,
    "totalAmount" REAL,
    "discountAmount" REAL DEFAULT 0,
    "taxAmount" REAL DEFAULT 0,
    "grandTotal" REAL,
    status TEXT DEFAULT 'draft',
    "dueDate" TEXT,
    "issuedBy" TEXT,
    "issuedAt" TEXT,
    "paidAt" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  payments: `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    "billId" TEXT,
    "patientId" TEXT,
    patient JSON,
    amount REAL,
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    status TEXT DEFAULT 'completed',
    "receivedBy" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  expenses: `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT,
    description TEXT,
    amount REAL,
    "expenseDate" TEXT,
    "paymentMethod" TEXT,
    "vendorName" TEXT,
    "receiptNumber" TEXT,
    status TEXT DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TEXT,
    notes TEXT,
    "createdBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  inventory_items: `CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    "skuNumber" TEXT,
    description TEXT,
    "quantityInStock" INTEGER DEFAULT 0,
    "reorderLevel" INTEGER DEFAULT 10,
    "unitPrice" REAL,
    "supplierName" TEXT,
    "expiryDate" TEXT,
    location TEXT,
    "isActive" INTEGER DEFAULT 1,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  equipment: `CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    "serialNumber" TEXT,
    "assetTag" TEXT,
    "purchaseDate" TEXT,
    "purchasePrice" REAL,
    "currentValue" REAL,
    "warrantyExpiry" TEXT,
    location TEXT,
    status TEXT DEFAULT 'available',
    "lastMaintenanceDate" TEXT,
    "nextMaintenanceDate" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  patient_wallets: `CREATE TABLE IF NOT EXISTS patient_wallets (
    id TEXT PRIMARY KEY,
    "patientId" TEXT UNIQUE,
    patient JSON,
    balance REAL DEFAULT 0,
    "lastTransactionAt" TEXT,
    "isActive" INTEGER DEFAULT 1,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  wallet_transactions: `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    "walletId" TEXT,
    type TEXT,
    amount REAL,
    description TEXT,
    reference TEXT,
    "balanceAfter" REAL,
    "createdBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  insurance_claims: `CREATE TABLE IF NOT EXISTS insurance_claims (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "enrolleeId" TEXT,
    "hmoId" TEXT,
    "claimType" TEXT,
    services JSON,
    "totalAmount" REAL,
    "approvedAmount" REAL,
    diagnosis TEXT,
    "icdCode" TEXT,
    status TEXT DEFAULT 'draft',
    "submittedAt" TEXT,
    "processedAt" TEXT,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    notes TEXT,
    "createdBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  blood_donors: `CREATE TABLE IF NOT EXISTS blood_donors (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    "bloodGroup" TEXT,
    genotype TEXT,
    "lastDonationDate" TEXT,
    "totalDonations" INTEGER DEFAULT 0,
    "isEligible" INTEGER DEFAULT 1,
    notes TEXT,
    "registeredAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  blood_units: `CREATE TABLE IF NOT EXISTS blood_units (
    id TEXT PRIMARY KEY,
    "donorId" TEXT,
    "donorName" TEXT,
    "bloodGroup" TEXT,
    "componentType" TEXT,
    "volumeMl" INTEGER,
    "collectionDate" TEXT,
    "expiryDate" TEXT,
    status TEXT DEFAULT 'available',
    "reservedForPatientId" TEXT,
    "transfusedAt" TEXT,
    "transfusedToPatientId" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  medical_assets: `CREATE TABLE IF NOT EXISTS medical_assets (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    "assetTag" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TEXT,
    "purchasePrice" REAL,
    "currentValue" REAL,
    "warrantyExpiry" TEXT,
    location TEXT,
    department TEXT,
    status TEXT DEFAULT 'available',
    "lastMaintenanceDate" TEXT,
    "nextMaintenanceDate" TEXT,
    "responsiblePerson" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  surgery_bookings: `CREATE TABLE IF NOT EXISTS surgery_bookings (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "surgeryType" TEXT,
    "surgeonId" TEXT,
    "surgeonName" TEXT,
    "anesthetistId" TEXT,
    "anesthetistName" TEXT,
    "theatreId" TEXT,
    "theatreName" TEXT,
    "scheduledDate" TEXT,
    "scheduledTime" TEXT,
    "estimatedDuration" INTEGER,
    status TEXT DEFAULT 'scheduled',
    priority TEXT DEFAULT 'routine',
    "preOpChecklist" JSON,
    notes TEXT,
    "bookedBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  immunization_records: `CREATE TABLE IF NOT EXISTS immunization_records (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "vaccineName" TEXT,
    "doseNumber" INTEGER,
    "batchNumber" TEXT,
    "administeredBy" TEXT,
    "administeredAt" TEXT,
    "nextDoseDate" TEXT,
    reactions TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  antenatal_visits: `CREATE TABLE IF NOT EXISTS antenatal_visits (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "visitNumber" INTEGER,
    "gestationalAge" TEXT,
    "bloodPressure" TEXT,
    weight REAL,
    "fundalHeight" REAL,
    "fetalHeartRate" INTEGER,
    "fetalMovement" TEXT,
    urine TEXT,
    "bloodGroup" TEXT,
    hemoglobin REAL,
    notes TEXT,
    "nextVisitDate" TEXT,
    "seenBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  patient_tasks: `CREATE TABLE IF NOT EXISTS patient_tasks (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "taskId" TEXT,
    "taskName" TEXT,
    "scheduledTime" TEXT,
    duration INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'routine',
    "assignedBy" TEXT,
    "startedAt" TEXT,
    "completedAt" TEXT,
    "completedBy" TEXT,
    recurring INTEGER DEFAULT 0,
    "recurrenceInterval" INTEGER,
    "nextOccurrence" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  staff_attendances: `CREATE TABLE IF NOT EXISTS staff_attendances (
    id TEXT PRIMARY KEY,
    "staffId" TEXT,
    "staffName" TEXT,
    "staffRole" TEXT,
    department TEXT,
    date TEXT,
    "signInTime" TEXT,
    "signInPhoto" TEXT,
    "signOutTime" TEXT,
    "signOutPhoto" TEXT,
    shift TEXT,
    status TEXT DEFAULT 'present',
    "deviceId" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  shift_swaps: `CREATE TABLE IF NOT EXISTS shift_swaps (
    id TEXT PRIMARY KEY,
    "requesterId" TEXT,
    "requesterName" TEXT,
    "requesterShift" TEXT,
    "requesterDate" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "targetShift" TEXT,
    "targetDate" TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  certifications: `CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    "staffId" TEXT,
    "staffName" TEXT,
    name TEXT,
    issuer TEXT,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    "certificateNumber" TEXT,
    document TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  training_records: `CREATE TABLE IF NOT EXISTS training_records (
    id TEXT PRIMARY KEY,
    "staffId" TEXT,
    "staffName" TEXT,
    "trainingName" TEXT,
    provider TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    hours INTEGER,
    status TEXT DEFAULT 'scheduled',
    score REAL,
    certificate TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  medication_administrations: `CREATE TABLE IF NOT EXISTS medication_administrations (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    patient JSON,
    "drugName" TEXT,
    dosage TEXT,
    route TEXT,
    "administeredBy" TEXT,
    "administeredAt" TEXT,
    notes TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  ambulance_calls: `CREATE TABLE IF NOT EXISTS ambulance_calls (
    id TEXT PRIMARY KEY,
    "callNumber" TEXT,
    "patientId" TEXT,
    patient JSON,
    "callerName" TEXT,
    "callerPhone" TEXT,
    "pickupLocation" TEXT,
    "destination" TEXT,
    "driverId" TEXT,
    "driverName" TEXT,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT,
    "dispatchTime" TEXT,
    "arrivalTime" TEXT,
    "returnTime" TEXT,
    distance REAL,
    status TEXT DEFAULT 'dispatched',
    priority TEXT DEFAULT 'routine',
    notes TEXT,
    "createdBy" TEXT,
    "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
  )`
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

    // Ensure consultation schema has required columns
    await ensureConsultationSchema(prisma)

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

        case 'consultations': {
          // Use raw SQL to ensure we get all columns including referredTo and sendBackTo
          const consultations = await p.$queryRawUnsafe(`
            SELECT
              id, "patientId", patient, "doctorId", "doctorName", status, "chiefComplaint",
              "historyOfPresentIllness", "pastMedicalHistory", "signsAndSymptoms",
              "bloodPressureSystolic", "bloodPressureDiastolic", temperature, pulse,
              "respiratoryRate", weight, height, "oxygenSaturation",
              "generalExamination", "systemExamination", "investigationsRequested",
              "scanRequested", "scanFindings", "provisionalDiagnosis", "finalDiagnosis",
              "treatmentPlan", prescriptions, "referredTo", "referralTo", "referralNotes",
              "sendBackTo", "sendBackNotes", "sentByNurseInitials", "sentAt",
              "assignedNurseId", "assignedNurseName", "assignedPharmacistId", "assignedPharmacistName",
              "assignedLabTechId", "assignedLabTechName", "assignedRecordsId", "assignedRecordsName",
              "createdAt", "updatedAt"
            FROM consultations
            ORDER BY "createdAt" DESC
          `)
          return successResponse({ data: consultations })
        }

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

        case 'routingRequests':
          try {
            const routingRequests = await p.$queryRawUnsafe(`
              SELECT * FROM routing_requests ORDER BY created_at DESC LIMIT 200
            `)
            return successResponse({ data: routingRequests || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        // New data types using raw SQL
        case 'bills':
        case 'bill':
          try {
            await ensureTableExists(p, 'bills', TABLE_CREATE_SQL.bills)
            const bills = await p.$queryRawUnsafe(`SELECT * FROM bills ORDER BY "createdAt" DESC`)
            return successResponse({ data: bills || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'payments':
        case 'payment':
          try {
            await ensureTableExists(p, 'payments', TABLE_CREATE_SQL.payments)
            const payments = await p.$queryRawUnsafe(`SELECT * FROM payments ORDER BY "createdAt" DESC`)
            return successResponse({ data: payments || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'expenses':
        case 'expense':
          try {
            await ensureTableExists(p, 'expenses', TABLE_CREATE_SQL.expenses)
            const expenses = await p.$queryRawUnsafe(`SELECT * FROM expenses ORDER BY "createdAt" DESC`)
            return successResponse({ data: expenses || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'inventoryItems':
        case 'inventoryItem':
          try {
            await ensureTableExists(p, 'inventory_items', TABLE_CREATE_SQL.inventory_items)
            const items = await p.$queryRawUnsafe(`SELECT * FROM inventory_items WHERE "isActive" = 1 ORDER BY "createdAt" DESC`)
            return successResponse({ data: items || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'equipment':
          try {
            await ensureTableExists(p, 'equipment', TABLE_CREATE_SQL.equipment)
            const equipment = await p.$queryRawUnsafe(`SELECT * FROM equipment ORDER BY "createdAt" DESC`)
            return successResponse({ data: equipment || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'patientWallets':
        case 'patientWallet':
          try {
            await ensureTableExists(p, 'patient_wallets', TABLE_CREATE_SQL.patient_wallets)
            const wallets = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets ORDER BY "createdAt" DESC`)
            return successResponse({ data: wallets || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'insuranceClaims':
        case 'insuranceClaim':
          try {
            await ensureTableExists(p, 'insurance_claims', TABLE_CREATE_SQL.insurance_claims)
            const claims = await p.$queryRawUnsafe(`SELECT * FROM insurance_claims ORDER BY "createdAt" DESC`)
            return successResponse({ data: claims || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'bloodDonors':
        case 'bloodDonor':
          try {
            await ensureTableExists(p, 'blood_donors', TABLE_CREATE_SQL.blood_donors)
            const donors = await p.$queryRawUnsafe(`SELECT * FROM blood_donors ORDER BY "registeredAt" DESC`)
            return successResponse({ data: donors || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'bloodUnits':
        case 'bloodUnit':
          try {
            await ensureTableExists(p, 'blood_units', TABLE_CREATE_SQL.blood_units)
            const units = await p.$queryRawUnsafe(`SELECT * FROM blood_units ORDER BY "createdAt" DESC`)
            return successResponse({ data: units || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'medicalAssets':
        case 'medicalAsset':
          try {
            await ensureTableExists(p, 'medical_assets', TABLE_CREATE_SQL.medical_assets)
            const assets = await p.$queryRawUnsafe(`SELECT * FROM medical_assets ORDER BY "createdAt" DESC`)
            return successResponse({ data: assets || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'surgeryBookings':
        case 'surgeryBooking':
          try {
            await ensureTableExists(p, 'surgery_bookings', TABLE_CREATE_SQL.surgery_bookings)
            const bookings = await p.$queryRawUnsafe(`SELECT * FROM surgery_bookings ORDER BY "createdAt" DESC`)
            return successResponse({ data: bookings || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'immunizationRecords':
        case 'immunizationRecord':
          try {
            await ensureTableExists(p, 'immunization_records', TABLE_CREATE_SQL.immunization_records)
            const records = await p.$queryRawUnsafe(`SELECT * FROM immunization_records ORDER BY "createdAt" DESC`)
            return successResponse({ data: records || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'antenatalVisits':
        case 'antenatalVisit':
          try {
            await ensureTableExists(p, 'antenatal_visits', TABLE_CREATE_SQL.antenatal_visits)
            const visits = await p.$queryRawUnsafe(`SELECT * FROM antenatal_visits ORDER BY "createdAt" DESC`)
            return successResponse({ data: visits || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'patientTasks':
        case 'patientTask':
          try {
            await ensureTableExists(p, 'patient_tasks', TABLE_CREATE_SQL.patient_tasks)
            const tasks = await p.$queryRawUnsafe(`SELECT * FROM patient_tasks ORDER BY "createdAt" DESC`)
            return successResponse({ data: tasks || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'staffAttendances':
        case 'staffAttendance':
          try {
            await ensureTableExists(p, 'staff_attendances', TABLE_CREATE_SQL.staff_attendances)
            const attendances = await p.$queryRawUnsafe(`SELECT * FROM staff_attendances ORDER BY "createdAt" DESC`)
            return successResponse({ data: attendances || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'shiftSwaps':
        case 'shiftSwap':
          try {
            await ensureTableExists(p, 'shift_swaps', TABLE_CREATE_SQL.shift_swaps)
            const swaps = await p.$queryRawUnsafe(`SELECT * FROM shift_swaps ORDER BY "createdAt" DESC`)
            return successResponse({ data: swaps || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'certifications':
        case 'certification':
          try {
            await ensureTableExists(p, 'certifications', TABLE_CREATE_SQL.certifications)
            const certs = await p.$queryRawUnsafe(`SELECT * FROM certifications ORDER BY "createdAt" DESC`)
            return successResponse({ data: certs || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'trainingRecords':
        case 'trainingRecord':
          try {
            await ensureTableExists(p, 'training_records', TABLE_CREATE_SQL.training_records)
            const records = await p.$queryRawUnsafe(`SELECT * FROM training_records ORDER BY "createdAt" DESC`)
            return successResponse({ data: records || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'medicationAdmins':
        case 'medicationAdmin':
          try {
            await ensureTableExists(p, 'medication_administrations', TABLE_CREATE_SQL.medication_administrations)
            const admins = await p.$queryRawUnsafe(`SELECT * FROM medication_administrations ORDER BY "createdAt" DESC`)
            return successResponse({ data: admins || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'ambulanceCalls':
        case 'ambulanceCall':
          try {
            await ensureTableExists(p, 'ambulance_calls', TABLE_CREATE_SQL.ambulance_calls)
            const calls = await p.$queryRawUnsafe(`SELECT * FROM ambulance_calls ORDER BY "createdAt" DESC`)
            return successResponse({ data: calls || [] })
          } catch (e) {
            return successResponse({ data: [] })
          }

        case 'all': {
          const [patients, vitals, drugs, labTests, labRequests, labResults, 
                  queueEntries, appointments, admissions, prescriptions, medicalCertificates,
                  referralLetters, dischargeSummaries, announcements, voiceNotes, users, rosters, attendance] = 
            await Promise.all([
              p.patients.findMany({ orderBy: { registeredAt: 'desc' } }),
              p.vital_signs.findMany({ orderBy: { recordedAt: 'desc' } }),
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

          // Fetch consultations separately with raw SQL to get all columns
          const consultations = await p.$queryRawUnsafe(`
            SELECT
              id, "patientId", patient, "doctorId", "doctorName", status, "chiefComplaint",
              "historyOfPresentIllness", "pastMedicalHistory", "signsAndSymptoms",
              "bloodPressureSystolic", "bloodPressureDiastolic", temperature, pulse,
              "respiratoryRate", weight, height, "oxygenSaturation",
              "generalExamination", "systemExamination", "investigationsRequested",
              "scanRequested", "scanFindings", "provisionalDiagnosis", "finalDiagnosis",
              "treatmentPlan", prescriptions, "referredTo", "referralTo", "referralNotes",
              "sendBackTo", "sendBackNotes", "sentByNurseInitials", "sentAt",
              "assignedNurseId", "assignedNurseName", "assignedPharmacistId", "assignedPharmacistName",
              "assignedLabTechId", "assignedLabTechName", "assignedRecordsId", "assignedRecordsName",
              "createdAt", "updatedAt"
            FROM consultations
            ORDER BY "createdAt" DESC
          `)

          // Fetch routing requests (may not exist yet, so handle gracefully)
          let routingRequests = []
          try {
            routingRequests = await p.$queryRawUnsafe(`
              SELECT * FROM routing_requests ORDER BY created_at DESC LIMIT 200
            `)
          } catch (e) {
            logger.debug('Routing requests table not available yet')
          }

          // Fetch new data types with graceful error handling
          let bills: any[] = [], payments: any[] = [], expenses: any[] = [], inventoryItems: any[] = []
          let equipment: any[] = [], patientWallets: any[] = [], insuranceClaims: any[] = [], bloodDonors: any[] = []
          let bloodUnits: any[] = [], medicalAssets: any[] = [], surgeryBookings: any[] = [], immunizationRecords: any[] = []
          let antenatalVisits: any[] = [], patientTasks: any[] = [], staffAttendances: any[] = [], shiftSwaps: any[] = []
          let certifications: any[] = [], trainingRecords: any[] = [], medicationAdmins: any[] = [], ambulanceCalls: any[] = []

          try {
            await ensureTableExists(p, 'bills', TABLE_CREATE_SQL.bills)
            bills = await p.$queryRawUnsafe(`SELECT * FROM bills ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'payments', TABLE_CREATE_SQL.payments)
            payments = await p.$queryRawUnsafe(`SELECT * FROM payments ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'expenses', TABLE_CREATE_SQL.expenses)
            expenses = await p.$queryRawUnsafe(`SELECT * FROM expenses ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'inventory_items', TABLE_CREATE_SQL.inventory_items)
            inventoryItems = await p.$queryRawUnsafe(`SELECT * FROM inventory_items ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'equipment', TABLE_CREATE_SQL.equipment)
            equipment = await p.$queryRawUnsafe(`SELECT * FROM equipment ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'patient_wallets', TABLE_CREATE_SQL.patient_wallets)
            patientWallets = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'insurance_claims', TABLE_CREATE_SQL.insurance_claims)
            insuranceClaims = await p.$queryRawUnsafe(`SELECT * FROM insurance_claims ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'blood_donors', TABLE_CREATE_SQL.blood_donors)
            bloodDonors = await p.$queryRawUnsafe(`SELECT * FROM blood_donors ORDER BY "registeredAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'blood_units', TABLE_CREATE_SQL.blood_units)
            bloodUnits = await p.$queryRawUnsafe(`SELECT * FROM blood_units ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'medical_assets', TABLE_CREATE_SQL.medical_assets)
            medicalAssets = await p.$queryRawUnsafe(`SELECT * FROM medical_assets ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'surgery_bookings', TABLE_CREATE_SQL.surgery_bookings)
            surgeryBookings = await p.$queryRawUnsafe(`SELECT * FROM surgery_bookings ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'immunization_records', TABLE_CREATE_SQL.immunization_records)
            immunizationRecords = await p.$queryRawUnsafe(`SELECT * FROM immunization_records ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'antenatal_visits', TABLE_CREATE_SQL.antenatal_visits)
            antenatalVisits = await p.$queryRawUnsafe(`SELECT * FROM antenatal_visits ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'patient_tasks', TABLE_CREATE_SQL.patient_tasks)
            patientTasks = await p.$queryRawUnsafe(`SELECT * FROM patient_tasks ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'staff_attendances', TABLE_CREATE_SQL.staff_attendances)
            staffAttendances = await p.$queryRawUnsafe(`SELECT * FROM staff_attendances ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'shift_swaps', TABLE_CREATE_SQL.shift_swaps)
            shiftSwaps = await p.$queryRawUnsafe(`SELECT * FROM shift_swaps ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'certifications', TABLE_CREATE_SQL.certifications)
            certifications = await p.$queryRawUnsafe(`SELECT * FROM certifications ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'training_records', TABLE_CREATE_SQL.training_records)
            trainingRecords = await p.$queryRawUnsafe(`SELECT * FROM training_records ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'medication_administrations', TABLE_CREATE_SQL.medication_administrations)
            medicationAdmins = await p.$queryRawUnsafe(`SELECT * FROM medication_administrations ORDER BY "createdAt" DESC`)
          } catch (e) {}

          try {
            await ensureTableExists(p, 'ambulance_calls', TABLE_CREATE_SQL.ambulance_calls)
            ambulanceCalls = await p.$queryRawUnsafe(`SELECT * FROM ambulance_calls ORDER BY "createdAt" DESC`)
          } catch (e) {}

          logger.debug('Fetched all data', { patientCount: patients.length })
          return successResponse({ 
            data: {
              patients, vitals, consultations, drugs, labTests, labRequests, labResults,
              queueEntries, appointments, admissions, prescriptions, medicalCertificates,
              referralLetters, dischargeSummaries, announcements, voiceNotes, users, rosters, attendance,
              routingRequests,
              // New data types
              bills, payments, expenses, inventoryItems, equipment, patientWallets, insuranceClaims,
              bloodDonors, bloodUnits, medicalAssets, surgeryBookings, immunizationRecords,
              antenatalVisits, patientTasks, staffAttendances, shiftSwaps, certifications,
              trainingRecords, medicationAdmins, ambulanceCalls
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
              type === 'auditLogs' ? 'auditLogs' :
              type === 'routingRequests' ? 'routingRequests' :
              // New data type mappings
              type === 'bill' ? 'bills' :
              type === 'bills' ? 'bills' :
              type === 'payment' ? 'payments' :
              type === 'payments' ? 'payments' :
              type === 'expense' ? 'expenses' :
              type === 'expenses' ? 'expenses' :
              type === 'inventoryItem' ? 'inventoryItems' :
              type === 'inventoryItems' ? 'inventoryItems' :
              type === 'equipment' ? 'equipment' :
              type === 'patientWallet' ? 'patientWallets' :
              type === 'patientWallets' ? 'patientWallets' :
              type === 'insuranceClaim' ? 'insuranceClaims' :
              type === 'insuranceClaims' ? 'insuranceClaims' :
              type === 'bloodDonor' ? 'bloodDonors' :
              type === 'bloodDonors' ? 'bloodDonors' :
              type === 'bloodUnit' ? 'bloodUnits' :
              type === 'bloodUnits' ? 'bloodUnits' :
              type === 'medicalAsset' ? 'medicalAssets' :
              type === 'medicalAssets' ? 'medicalAssets' :
              type === 'surgeryBooking' ? 'surgeryBookings' :
              type === 'surgeryBookings' ? 'surgeryBookings' :
              type === 'immunizationRecord' ? 'immunizationRecords' :
              type === 'immunizationRecords' ? 'immunizationRecords' :
              type === 'antenatalVisit' ? 'antenatalVisits' :
              type === 'antenatalVisits' ? 'antenatalVisits' :
              type === 'patientTask' ? 'patientTasks' :
              type === 'patientTasks' ? 'patientTasks' :
              type === 'staffAttendance' ? 'staffAttendances' :
              type === 'staffAttendances' ? 'staffAttendances' :
              type === 'shiftSwap' ? 'shiftSwaps' :
              type === 'shiftSwaps' ? 'shiftSwaps' :
              type === 'certification' ? 'certifications' :
              type === 'certifications' ? 'certifications' :
              type === 'trainingRecord' ? 'trainingRecords' :
              type === 'trainingRecords' ? 'trainingRecords' :
              type === 'medicationAdmin' ? 'medicationAdmins' :
              type === 'medicationAdmins' ? 'medicationAdmins' :
              type === 'ambulanceCall' ? 'ambulanceCalls' :
              type === 'ambulanceCalls' ? 'ambulanceCalls' : type
  
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

    // Ensure consultation schema has required columns
    await ensureConsultationSchema(prisma)

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
          const id = generateId()

          // Always ensure columns exist first
          await ensureConsultationSchema(p)

          // Log what we received
          console.log('[CONSULTATION] Received data:', JSON.stringify({
            patientId: data.patientId,
            referredTo: data.referredTo,
            status: data.status,
            chiefComplaint: data.chiefComplaint?.substring(0, 50)
          }))

          // Build safe values - escape single quotes
          const escapeVal = (val: any) => val ? String(val).replace(/'/g, "''") : null
          const patientJson = data.patient ? JSON.stringify(data.patient).replace(/'/g, "''") : null
          const patientIdVal = escapeVal(data.patientId)
          const doctorIdVal = escapeVal(data.doctorId)
          const doctorNameVal = escapeVal(data.doctorName)
          const statusVal = escapeVal(data.status || 'pending')
          const chiefComplaintVal = escapeVal(data.chiefComplaint)
          const signsAndSymptomsVal = escapeVal(data.signsAndSymptoms)
          const sentByNurseInitialsVal = escapeVal(data.sentByNurseInitials)
          const referredToVal = escapeVal(data.referredTo)
          const referralNotesVal = escapeVal(data.referralNotes)
          const sentAtVal = escapeVal(data.sentAt)

          // Use unsafe raw SQL with explicit values
          const sql = `
            INSERT INTO consultations (
              id, "patientId", patient, "doctorId", "doctorName", status, "chiefComplaint",
              "signsAndSymptoms", "sentByNurseInitials", "referredTo", "referralNotes",
              "sentAt", "createdAt", "updatedAt"
            ) VALUES (
              '${id}',
              ${patientIdVal ? `'${patientIdVal}'` : 'NULL'},
              ${patientJson ? `'${patientJson}'` : 'NULL'},
              ${doctorIdVal ? `'${doctorIdVal}'` : 'NULL'},
              ${doctorNameVal ? `'${doctorNameVal}'` : 'NULL'},
              '${statusVal}',
              ${chiefComplaintVal ? `'${chiefComplaintVal}'` : 'NULL'},
              ${signsAndSymptomsVal ? `'${signsAndSymptomsVal}'` : 'NULL'},
              ${sentByNurseInitialsVal ? `'${sentByNurseInitialsVal}'` : 'NULL'},
              ${referredToVal ? `'${referredToVal}'` : 'NULL'},
              ${referralNotesVal ? `'${referralNotesVal}'` : 'NULL'},
              ${sentAtVal ? `'${sentAtVal}'` : 'NULL'},
              '${now}',
              '${now}'
            )
          `

          console.log('[CONSULTATION] SQL:', sql.substring(0, 200))
          await p.$executeRawUnsafe(sql)

          // Fetch the created consultation
          const consultations = await p.$queryRawUnsafe(`
            SELECT
              id, "patientId", patient, "doctorId", "doctorName", status, "chiefComplaint",
              "referredTo", "sentByNurseInitials", "sentAt", "createdAt"
            FROM consultations WHERE id = '${id}'
          `)
          const consultation = Array.isArray(consultations) ? consultations[0] : null

          console.log('[CONSULTATION] Saved:', JSON.stringify(consultation))
          logger.info('Consultation created', { id, referredTo: referredToVal, status: statusVal })
          broadcastChange('consultation_created', 'consultation', consultation)
          return successResponse({ data: consultation || { ...data, id, createdAt: now } })
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

        case 'routingRequest': {
          // Ensure routing_requests table exists
          try {
            await p.$executeRawUnsafe(`
              CREATE TABLE IF NOT EXISTS routing_requests (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                sender_role TEXT NOT NULL,
                sender_initials TEXT,
                receiver_id TEXT,
                receiver_name TEXT,
                receiver_role TEXT,
                receiver_department TEXT,
                patient_id TEXT,
                patient_name TEXT,
                patient_hospital_number TEXT,
                request_type TEXT NOT NULL,
                priority TEXT DEFAULT 'routine',
                purpose TEXT,
                subject TEXT NOT NULL,
                message TEXT,
                notes TEXT,
                consultation_id TEXT,
                lab_request_id TEXT,
                prescription_id TEXT,
                status TEXT DEFAULT 'pending',
                acknowledged_at TIMESTAMP,
                acknowledged_by TEXT,
                completed_at TIMESTAMP,
                completed_by TEXT,
                completion_notes TEXT,
                seen_by TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
              )
            `)
          } catch (e) {
            // Table might already exist
          }

          const escapeVal = (val: any) => val ? String(val).replace(/'/g, "''") : null
          const sql = `
            INSERT INTO routing_requests (
              id, sender_id, sender_name, sender_role, sender_initials,
              receiver_id, receiver_name, receiver_role, receiver_department,
              patient_id, patient_name, patient_hospital_number,
              request_type, priority, purpose, subject, message, notes,
              status, created_at
            ) VALUES (
              '${data.id || generateId()}',
              '${escapeVal(data.senderId || data.staffId)}',
              '${escapeVal(data.senderName || data.staffName)}',
              '${escapeVal(data.senderRole || data.staffRole)}',
              ${data.senderInitials ? `'${escapeVal(data.senderInitials)}'` : 'NULL'},
              ${data.receiverId ? `'${escapeVal(data.receiverId)}'` : 'NULL'},
              ${data.receiverName ? `'${escapeVal(data.receiverName)}'` : 'NULL'},
              ${data.receiverRole ? `'${escapeVal(data.receiverRole)}'` : 'NULL'},
              ${data.receiverDepartment ? `'${escapeVal(data.receiverDepartment)}'` : 'NULL'},
              ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'},
              ${data.patientName ? `'${escapeVal(data.patientName)}'` : 'NULL'},
              ${data.patientHospitalNumber ? `'${escapeVal(data.patientHospitalNumber)}'` : 'NULL'},
              '${escapeVal(data.requestType)}',
              '${escapeVal(data.priority) || 'routine'}',
              ${data.purpose ? `'${escapeVal(data.purpose)}'` : 'NULL'},
              '${escapeVal(data.subject)}',
              ${data.message ? `'${escapeVal(data.message)}'` : 'NULL'},
              ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'},
              'pending',
              NOW()
            )
          `
          await p.$executeRawUnsafe(sql)
          logger.info('Routing request created', { id: data.id })
          broadcastChange('routingRequest_created', 'routingRequest', data)
          return successResponse({ data })
        }

        // New data types - Bill
        case 'bill': {
          const id = generateId()
          await ensureTableExists(p, 'bills', TABLE_CREATE_SQL.bills)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const itemsJson = data.items ? `'${JSON.stringify(data.items).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO bills (id, "patientId", patient, "billNumber", "billType", items, "totalAmount", "discountAmount", "taxAmount", "grandTotal", status, "dueDate", "issuedBy", "issuedAt", notes, "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, '${escapeVal(data.billNumber) || `BILL-${Date.now()}`}', ${data.billType ? `'${escapeVal(data.billType)}'` : 'NULL'}, ${itemsJson}, ${data.totalAmount || 0}, ${data.discountAmount || 0}, ${data.taxAmount || 0}, ${data.grandTotal || 0}, '${data.status || 'draft'}', ${data.dueDate ? `'${escapeVal(data.dueDate)}'` : 'NULL'}, ${data.issuedBy ? `'${escapeVal(data.issuedBy)}'` : 'NULL'}, ${data.issuedAt ? `'${escapeVal(data.issuedAt)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Bill created', { id })
          broadcastChange('bill_created', 'bill', record)
          return successResponse({ data: record })
        }

        // Payment
        case 'payment': {
          const id = generateId()
          await ensureTableExists(p, 'payments', TABLE_CREATE_SQL.payments)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO payments (id, "billId", "patientId", patient, amount, "paymentMethod", "referenceNumber", status, "receivedBy", notes, "createdAt")
            VALUES ('${id}', ${data.billId ? `'${escapeVal(data.billId)}'` : 'NULL'}, ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.amount || 0}, ${data.paymentMethod ? `'${escapeVal(data.paymentMethod)}'` : 'NULL'}, ${data.referenceNumber ? `'${escapeVal(data.referenceNumber)}'` : 'NULL'}, '${data.status || 'completed'}', ${data.receivedBy ? `'${escapeVal(data.receivedBy)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Payment created', { id })
          broadcastChange('payment_created', 'payment', record)
          return successResponse({ data: record })
        }

        // Expense
        case 'expense': {
          const id = generateId()
          await ensureTableExists(p, 'expenses', TABLE_CREATE_SQL.expenses)
          const sql = `
            INSERT INTO expenses (id, category, description, amount, "expenseDate", "paymentMethod", "vendorName", "receiptNumber", status, "approvedBy", "approvedAt", notes, "createdBy", "createdAt")
            VALUES ('${id}', ${data.category ? `'${escapeVal(data.category)}'` : 'NULL'}, ${data.description ? `'${escapeVal(data.description)}'` : 'NULL'}, ${data.amount || 0}, ${data.expenseDate ? `'${escapeVal(data.expenseDate)}'` : 'NULL'}, ${data.paymentMethod ? `'${escapeVal(data.paymentMethod)}'` : 'NULL'}, ${data.vendorName ? `'${escapeVal(data.vendorName)}'` : 'NULL'}, ${data.receiptNumber ? `'${escapeVal(data.receiptNumber)}'` : 'NULL'}, '${data.status || 'pending'}', ${data.approvedBy ? `'${escapeVal(data.approvedBy)}'` : 'NULL'}, ${data.approvedAt ? `'${escapeVal(data.approvedAt)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, ${data.createdBy ? `'${escapeVal(data.createdBy)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Expense created', { id })
          broadcastChange('expense_created', 'expense', record)
          return successResponse({ data: record })
        }

        // Inventory Item
        case 'inventoryItem': {
          const id = generateId()
          await ensureTableExists(p, 'inventory_items', TABLE_CREATE_SQL.inventory_items)
          const sql = `
            INSERT INTO inventory_items (id, name, category, "skuNumber", description, "quantityInStock", "reorderLevel", "unitPrice", "supplierName", "expiryDate", location, "isActive", "createdAt")
            VALUES ('${id}', ${data.name ? `'${escapeVal(data.name)}'` : 'NULL'}, ${data.category ? `'${escapeVal(data.category)}'` : 'NULL'}, ${data.skuNumber ? `'${escapeVal(data.skuNumber)}'` : 'NULL'}, ${data.description ? `'${escapeVal(data.description)}'` : 'NULL'}, ${data.quantityInStock || 0}, ${data.reorderLevel || 10}, ${data.unitPrice || 0}, ${data.supplierName ? `'${escapeVal(data.supplierName)}'` : 'NULL'}, ${data.expiryDate ? `'${escapeVal(data.expiryDate)}'` : 'NULL'}, ${data.location ? `'${escapeVal(data.location)}'` : 'NULL'}, 1, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now, isActive: true }
          logger.info('Inventory item created', { id })
          broadcastChange('inventoryItem_created', 'inventoryItem', record)
          return successResponse({ data: record })
        }

        // Equipment
        case 'equipment': {
          const id = generateId()
          await ensureTableExists(p, 'equipment', TABLE_CREATE_SQL.equipment)
          const sql = `
            INSERT INTO equipment (id, name, category, "serialNumber", "assetTag", "purchaseDate", "purchasePrice", "currentValue", "warrantyExpiry", location, status, "lastMaintenanceDate", "nextMaintenanceDate", notes, "createdAt")
            VALUES ('${id}', ${data.name ? `'${escapeVal(data.name)}'` : 'NULL'}, ${data.category ? `'${escapeVal(data.category)}'` : 'NULL'}, ${data.serialNumber ? `'${escapeVal(data.serialNumber)}'` : 'NULL'}, ${data.assetTag ? `'${escapeVal(data.assetTag)}'` : 'NULL'}, ${data.purchaseDate ? `'${escapeVal(data.purchaseDate)}'` : 'NULL'}, ${data.purchasePrice || 0}, ${data.currentValue || 0}, ${data.warrantyExpiry ? `'${escapeVal(data.warrantyExpiry)}'` : 'NULL'}, ${data.location ? `'${escapeVal(data.location)}'` : 'NULL'}, '${data.status || 'available'}', ${data.lastMaintenanceDate ? `'${escapeVal(data.lastMaintenanceDate)}'` : 'NULL'}, ${data.nextMaintenanceDate ? `'${escapeVal(data.nextMaintenanceDate)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Equipment created', { id })
          broadcastChange('equipment_created', 'equipment', record)
          return successResponse({ data: record })
        }

        // Patient Wallet
        case 'patientWallet': {
          const id = generateId()
          await ensureTableExists(p, 'patient_wallets', TABLE_CREATE_SQL.patient_wallets)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO patient_wallets (id, "patientId", patient, balance, "isActive", "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.balance || 0}, 1, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now, isActive: true }
          logger.info('Patient wallet created', { id })
          broadcastChange('patientWallet_created', 'patientWallet', record)
          return successResponse({ data: record })
        }

        // Insurance Claim
        case 'insuranceClaim': {
          const id = generateId()
          await ensureTableExists(p, 'insurance_claims', TABLE_CREATE_SQL.insurance_claims)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const servicesJson = data.services ? `'${JSON.stringify(data.services).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO insurance_claims (id, "patientId", patient, "enrolleeId", "hmoId", "claimType", services, "totalAmount", "approvedAmount", diagnosis, "icdCode", status, notes, "createdBy", "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.enrolleeId ? `'${escapeVal(data.enrolleeId)}'` : 'NULL'}, ${data.hmoId ? `'${escapeVal(data.hmoId)}'` : 'NULL'}, ${data.claimType ? `'${escapeVal(data.claimType)}'` : 'NULL'}, ${servicesJson}, ${data.totalAmount || 0}, ${data.approvedAmount || 0}, ${data.diagnosis ? `'${escapeVal(data.diagnosis)}'` : 'NULL'}, ${data.icdCode ? `'${escapeVal(data.icdCode)}'` : 'NULL'}, '${data.status || 'draft'}', ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, ${data.createdBy ? `'${escapeVal(data.createdBy)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Insurance claim created', { id })
          broadcastChange('insuranceClaim_created', 'insuranceClaim', record)
          return successResponse({ data: record })
        }

        // Blood Donor
        case 'bloodDonor': {
          const id = generateId()
          await ensureTableExists(p, 'blood_donors', TABLE_CREATE_SQL.blood_donors)
          const sql = `
            INSERT INTO blood_donors (id, name, phone, email, "bloodGroup", genotype, "lastDonationDate", "totalDonations", "isEligible", notes, "registeredAt")
            VALUES ('${id}', ${data.name ? `'${escapeVal(data.name)}'` : 'NULL'}, ${data.phone ? `'${escapeVal(data.phone)}'` : 'NULL'}, ${data.email ? `'${escapeVal(data.email)}'` : 'NULL'}, ${data.bloodGroup ? `'${escapeVal(data.bloodGroup)}'` : 'NULL'}, ${data.genotype ? `'${escapeVal(data.genotype)}'` : 'NULL'}, ${data.lastDonationDate ? `'${escapeVal(data.lastDonationDate)}'` : 'NULL'}, ${data.totalDonations || 0}, ${data.isEligible !== false ? 1 : 0}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, registeredAt: now }
          logger.info('Blood donor created', { id })
          broadcastChange('bloodDonor_created', 'bloodDonor', record)
          return successResponse({ data: record })
        }

        // Blood Unit
        case 'bloodUnit': {
          const id = generateId()
          await ensureTableExists(p, 'blood_units', TABLE_CREATE_SQL.blood_units)
          const sql = `
            INSERT INTO blood_units (id, "donorId", "donorName", "bloodGroup", "componentType", "volumeMl", "collectionDate", "expiryDate", status, "reservedForPatientId", "transfusedAt", "transfusedToPatientId", notes, "createdAt")
            VALUES ('${id}', ${data.donorId ? `'${escapeVal(data.donorId)}'` : 'NULL'}, ${data.donorName ? `'${escapeVal(data.donorName)}'` : 'NULL'}, ${data.bloodGroup ? `'${escapeVal(data.bloodGroup)}'` : 'NULL'}, ${data.componentType ? `'${escapeVal(data.componentType)}'` : 'NULL'}, ${data.volumeMl || 0}, ${data.collectionDate ? `'${escapeVal(data.collectionDate)}'` : 'NULL'}, ${data.expiryDate ? `'${escapeVal(data.expiryDate)}'` : 'NULL'}, '${data.status || 'available'}', ${data.reservedForPatientId ? `'${escapeVal(data.reservedForPatientId)}'` : 'NULL'}, ${data.transfusedAt ? `'${escapeVal(data.transfusedAt)}'` : 'NULL'}, ${data.transfusedToPatientId ? `'${escapeVal(data.transfusedToPatientId)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Blood unit created', { id })
          broadcastChange('bloodUnit_created', 'bloodUnit', record)
          return successResponse({ data: record })
        }

        // Medical Asset
        case 'medicalAsset': {
          const id = generateId()
          await ensureTableExists(p, 'medical_assets', TABLE_CREATE_SQL.medical_assets)
          const sql = `
            INSERT INTO medical_assets (id, name, category, "assetTag", "serialNumber", "purchaseDate", "purchasePrice", "currentValue", "warrantyExpiry", location, department, status, "lastMaintenanceDate", "nextMaintenanceDate", "responsiblePerson", notes, "createdAt")
            VALUES ('${id}', ${data.name ? `'${escapeVal(data.name)}'` : 'NULL'}, ${data.category ? `'${escapeVal(data.category)}'` : 'NULL'}, ${data.assetTag ? `'${escapeVal(data.assetTag)}'` : 'NULL'}, ${data.serialNumber ? `'${escapeVal(data.serialNumber)}'` : 'NULL'}, ${data.purchaseDate ? `'${escapeVal(data.purchaseDate)}'` : 'NULL'}, ${data.purchasePrice || 0}, ${data.currentValue || 0}, ${data.warrantyExpiry ? `'${escapeVal(data.warrantyExpiry)}'` : 'NULL'}, ${data.location ? `'${escapeVal(data.location)}'` : 'NULL'}, ${data.department ? `'${escapeVal(data.department)}'` : 'NULL'}, '${data.status || 'available'}', ${data.lastMaintenanceDate ? `'${escapeVal(data.lastMaintenanceDate)}'` : 'NULL'}, ${data.nextMaintenanceDate ? `'${escapeVal(data.nextMaintenanceDate)}'` : 'NULL'}, ${data.responsiblePerson ? `'${escapeVal(data.responsiblePerson)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Medical asset created', { id })
          broadcastChange('medicalAsset_created', 'medicalAsset', record)
          return successResponse({ data: record })
        }

        // Surgery Booking
        case 'surgeryBooking': {
          const id = generateId()
          await ensureTableExists(p, 'surgery_bookings', TABLE_CREATE_SQL.surgery_bookings)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const checklistJson = data.preOpChecklist ? `'${JSON.stringify(data.preOpChecklist).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO surgery_bookings (id, "patientId", patient, "surgeryType", "surgeonId", "surgeonName", "anesthetistId", "anesthetistName", "theatreId", "theatreName", "scheduledDate", "scheduledTime", "estimatedDuration", status, priority, "preOpChecklist", notes, "bookedBy", "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.surgeryType ? `'${escapeVal(data.surgeryType)}'` : 'NULL'}, ${data.surgeonId ? `'${escapeVal(data.surgeonId)}'` : 'NULL'}, ${data.surgeonName ? `'${escapeVal(data.surgeonName)}'` : 'NULL'}, ${data.anesthetistId ? `'${escapeVal(data.anesthetistId)}'` : 'NULL'}, ${data.anesthetistName ? `'${escapeVal(data.anesthetistName)}'` : 'NULL'}, ${data.theatreId ? `'${escapeVal(data.theatreId)}'` : 'NULL'}, ${data.theatreName ? `'${escapeVal(data.theatreName)}'` : 'NULL'}, ${data.scheduledDate ? `'${escapeVal(data.scheduledDate)}'` : 'NULL'}, ${data.scheduledTime ? `'${escapeVal(data.scheduledTime)}'` : 'NULL'}, ${data.estimatedDuration || 0}, '${data.status || 'scheduled'}', '${data.priority || 'routine'}', ${checklistJson}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, ${data.bookedBy ? `'${escapeVal(data.bookedBy)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Surgery booking created', { id })
          broadcastChange('surgeryBooking_created', 'surgeryBooking', record)
          return successResponse({ data: record })
        }

        // Immunization Record
        case 'immunizationRecord': {
          const id = generateId()
          await ensureTableExists(p, 'immunization_records', TABLE_CREATE_SQL.immunization_records)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO immunization_records (id, "patientId", patient, "vaccineName", "doseNumber", "batchNumber", "administeredBy", "administeredAt", "nextDoseDate", reactions, notes, "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.vaccineName ? `'${escapeVal(data.vaccineName)}'` : 'NULL'}, ${data.doseNumber || 1}, ${data.batchNumber ? `'${escapeVal(data.batchNumber)}'` : 'NULL'}, ${data.administeredBy ? `'${escapeVal(data.administeredBy)}'` : 'NULL'}, ${data.administeredAt ? `'${escapeVal(data.administeredAt)}'` : 'NULL'}, ${data.nextDoseDate ? `'${escapeVal(data.nextDoseDate)}'` : 'NULL'}, ${data.reactions ? `'${escapeVal(data.reactions)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Immunization record created', { id })
          broadcastChange('immunizationRecord_created', 'immunizationRecord', record)
          return successResponse({ data: record })
        }

        // Antenatal Visit
        case 'antenatalVisit': {
          const id = generateId()
          await ensureTableExists(p, 'antenatal_visits', TABLE_CREATE_SQL.antenatal_visits)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO antenatal_visits (id, "patientId", patient, "visitNumber", "gestationalAge", "bloodPressure", weight, "fundalHeight", "fetalHeartRate", "fetalMovement", urine, "bloodGroup", hemoglobin, notes, "nextVisitDate", "seenBy", "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.visitNumber || 1}, ${data.gestationalAge ? `'${escapeVal(data.gestationalAge)}'` : 'NULL'}, ${data.bloodPressure ? `'${escapeVal(data.bloodPressure)}'` : 'NULL'}, ${data.weight || 0}, ${data.fundalHeight || 0}, ${data.fetalHeartRate || 0}, ${data.fetalMovement ? `'${escapeVal(data.fetalMovement)}'` : 'NULL'}, ${data.urine ? `'${escapeVal(data.urine)}'` : 'NULL'}, ${data.bloodGroup ? `'${escapeVal(data.bloodGroup)}'` : 'NULL'}, ${data.hemoglobin || 0}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, ${data.nextVisitDate ? `'${escapeVal(data.nextVisitDate)}'` : 'NULL'}, ${data.seenBy ? `'${escapeVal(data.seenBy)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Antenatal visit created', { id })
          broadcastChange('antenatalVisit_created', 'antenatalVisit', record)
          return successResponse({ data: record })
        }

        // Patient Task
        case 'patientTask': {
          const id = generateId()
          await ensureTableExists(p, 'patient_tasks', TABLE_CREATE_SQL.patient_tasks)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO patient_tasks (id, "patientId", patient, "taskId", "taskName", "scheduledTime", duration, notes, status, priority, "assignedBy", "startedAt", "completedAt", "completedBy", recurring, "recurrenceInterval", "nextOccurrence", "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.taskId ? `'${escapeVal(data.taskId)}'` : 'NULL'}, ${data.taskName ? `'${escapeVal(data.taskName)}'` : 'NULL'}, ${data.scheduledTime ? `'${escapeVal(data.scheduledTime)}'` : 'NULL'}, ${data.duration || 0}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${data.status || 'pending'}', '${data.priority || 'routine'}', ${data.assignedBy ? `'${escapeVal(data.assignedBy)}'` : 'NULL'}, ${data.startedAt ? `'${escapeVal(data.startedAt)}'` : 'NULL'}, ${data.completedAt ? `'${escapeVal(data.completedAt)}'` : 'NULL'}, ${data.completedBy ? `'${escapeVal(data.completedBy)}'` : 'NULL'}, ${data.recurring ? 1 : 0}, ${data.recurrenceInterval || 'NULL'}, ${data.nextOccurrence ? `'${escapeVal(data.nextOccurrence)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Patient task created', { id })
          broadcastChange('patientTask_created', 'patientTask', record)
          return successResponse({ data: record })
        }

        // Staff Attendance
        case 'staffAttendance': {
          const id = generateId()
          await ensureTableExists(p, 'staff_attendances', TABLE_CREATE_SQL.staff_attendances)
          const sql = `
            INSERT INTO staff_attendances (id, "staffId", "staffName", "staffRole", department, date, "signInTime", "signInPhoto", "signOutTime", "signOutPhoto", shift, status, "deviceId", notes, "createdAt")
            VALUES ('${id}', ${data.staffId ? `'${escapeVal(data.staffId)}'` : 'NULL'}, ${data.staffName ? `'${escapeVal(data.staffName)}'` : 'NULL'}, ${data.staffRole ? `'${escapeVal(data.staffRole)}'` : 'NULL'}, ${data.department ? `'${escapeVal(data.department)}'` : 'NULL'}, ${data.date ? `'${escapeVal(data.date)}'` : 'NULL'}, ${data.signInTime ? `'${escapeVal(data.signInTime)}'` : 'NULL'}, ${data.signInPhoto ? `'${escapeVal(data.signInPhoto)}'` : 'NULL'}, ${data.signOutTime ? `'${escapeVal(data.signOutTime)}'` : 'NULL'}, ${data.signOutPhoto ? `'${escapeVal(data.signOutPhoto)}'` : 'NULL'}, ${data.shift ? `'${escapeVal(data.shift)}'` : 'NULL'}, '${data.status || 'present'}', ${data.deviceId ? `'${escapeVal(data.deviceId)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Staff attendance created', { id })
          broadcastChange('staffAttendance_created', 'staffAttendance', record)
          return successResponse({ data: record })
        }

        // Shift Swap
        case 'shiftSwap': {
          const id = generateId()
          await ensureTableExists(p, 'shift_swaps', TABLE_CREATE_SQL.shift_swaps)
          const sql = `
            INSERT INTO shift_swaps (id, "requesterId", "requesterName", "requesterShift", "requesterDate", "targetId", "targetName", "targetShift", "targetDate", reason, status, "approvedBy", "approvedAt", notes, "createdAt")
            VALUES ('${id}', ${data.requesterId ? `'${escapeVal(data.requesterId)}'` : 'NULL'}, ${data.requesterName ? `'${escapeVal(data.requesterName)}'` : 'NULL'}, ${data.requesterShift ? `'${escapeVal(data.requesterShift)}'` : 'NULL'}, ${data.requesterDate ? `'${escapeVal(data.requesterDate)}'` : 'NULL'}, ${data.targetId ? `'${escapeVal(data.targetId)}'` : 'NULL'}, ${data.targetName ? `'${escapeVal(data.targetName)}'` : 'NULL'}, ${data.targetShift ? `'${escapeVal(data.targetShift)}'` : 'NULL'}, ${data.targetDate ? `'${escapeVal(data.targetDate)}'` : 'NULL'}, ${data.reason ? `'${escapeVal(data.reason)}'` : 'NULL'}, '${data.status || 'pending'}', ${data.approvedBy ? `'${escapeVal(data.approvedBy)}'` : 'NULL'}, ${data.approvedAt ? `'${escapeVal(data.approvedAt)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Shift swap created', { id })
          broadcastChange('shiftSwap_created', 'shiftSwap', record)
          return successResponse({ data: record })
        }

        // Certification
        case 'certification': {
          const id = generateId()
          await ensureTableExists(p, 'certifications', TABLE_CREATE_SQL.certifications)
          const sql = `
            INSERT INTO certifications (id, "staffId", "staffName", name, issuer, "issueDate", "expiryDate", "certificateNumber", document, status, notes, "createdAt")
            VALUES ('${id}', ${data.staffId ? `'${escapeVal(data.staffId)}'` : 'NULL'}, ${data.staffName ? `'${escapeVal(data.staffName)}'` : 'NULL'}, ${data.name ? `'${escapeVal(data.name)}'` : 'NULL'}, ${data.issuer ? `'${escapeVal(data.issuer)}'` : 'NULL'}, ${data.issueDate ? `'${escapeVal(data.issueDate)}'` : 'NULL'}, ${data.expiryDate ? `'${escapeVal(data.expiryDate)}'` : 'NULL'}, ${data.certificateNumber ? `'${escapeVal(data.certificateNumber)}'` : 'NULL'}, ${data.document ? `'${escapeVal(data.document)}'` : 'NULL'}, '${data.status || 'active'}', ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Certification created', { id })
          broadcastChange('certification_created', 'certification', record)
          return successResponse({ data: record })
        }

        // Training Record
        case 'trainingRecord': {
          const id = generateId()
          await ensureTableExists(p, 'training_records', TABLE_CREATE_SQL.training_records)
          const sql = `
            INSERT INTO training_records (id, "staffId", "staffName", "trainingName", provider, "startDate", "endDate", hours, status, score, certificate, notes, "createdAt")
            VALUES ('${id}', ${data.staffId ? `'${escapeVal(data.staffId)}'` : 'NULL'}, ${data.staffName ? `'${escapeVal(data.staffName)}'` : 'NULL'}, ${data.trainingName ? `'${escapeVal(data.trainingName)}'` : 'NULL'}, ${data.provider ? `'${escapeVal(data.provider)}'` : 'NULL'}, ${data.startDate ? `'${escapeVal(data.startDate)}'` : 'NULL'}, ${data.endDate ? `'${escapeVal(data.endDate)}'` : 'NULL'}, ${data.hours || 0}, '${data.status || 'scheduled'}', ${data.score || 'NULL'}, ${data.certificate ? `'${escapeVal(data.certificate)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Training record created', { id })
          broadcastChange('trainingRecord_created', 'trainingRecord', record)
          return successResponse({ data: record })
        }

        // Medication Administration
        case 'medicationAdmin': {
          const id = generateId()
          await ensureTableExists(p, 'medication_administrations', TABLE_CREATE_SQL.medication_administrations)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO medication_administrations (id, "patientId", patient, "drugName", dosage, route, "administeredBy", "administeredAt", notes, "createdAt")
            VALUES ('${id}', ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.drugName ? `'${escapeVal(data.drugName)}'` : 'NULL'}, ${data.dosage ? `'${escapeVal(data.dosage)}'` : 'NULL'}, ${data.route ? `'${escapeVal(data.route)}'` : 'NULL'}, ${data.administeredBy ? `'${escapeVal(data.administeredBy)}'` : 'NULL'}, ${data.administeredAt ? `'${escapeVal(data.administeredAt)}'` : 'NULL'}, ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Medication administration created', { id })
          broadcastChange('medicationAdmin_created', 'medicationAdmin', record)
          return successResponse({ data: record })
        }

        // Ambulance Call
        case 'ambulanceCall': {
          const id = generateId()
          await ensureTableExists(p, 'ambulance_calls', TABLE_CREATE_SQL.ambulance_calls)
          const patientJson = data.patient ? `'${JSON.stringify(data.patient).replace(/'/g, "''")}'` : 'NULL'
          const sql = `
            INSERT INTO ambulance_calls (id, "callNumber", "patientId", patient, "callerName", "callerPhone", "pickupLocation", destination, "driverId", "driverName", "vehicleId", "vehicleNumber", "dispatchTime", "arrivalTime", "returnTime", distance, status, priority, notes, "createdBy", "createdAt")
            VALUES ('${id}', ${data.callNumber ? `'${escapeVal(data.callNumber)}'` : `'AMB-${Date.now()}'`}, ${data.patientId ? `'${escapeVal(data.patientId)}'` : 'NULL'}, ${patientJson}, ${data.callerName ? `'${escapeVal(data.callerName)}'` : 'NULL'}, ${data.callerPhone ? `'${escapeVal(data.callerPhone)}'` : 'NULL'}, ${data.pickupLocation ? `'${escapeVal(data.pickupLocation)}'` : 'NULL'}, ${data.destination ? `'${escapeVal(data.destination)}'` : 'NULL'}, ${data.driverId ? `'${escapeVal(data.driverId)}'` : 'NULL'}, ${data.driverName ? `'${escapeVal(data.driverName)}'` : 'NULL'}, ${data.vehicleId ? `'${escapeVal(data.vehicleId)}'` : 'NULL'}, ${data.vehicleNumber ? `'${escapeVal(data.vehicleNumber)}'` : 'NULL'}, ${data.dispatchTime ? `'${escapeVal(data.dispatchTime)}'` : 'NULL'}, ${data.arrivalTime ? `'${escapeVal(data.arrivalTime)}'` : 'NULL'}, ${data.returnTime ? `'${escapeVal(data.returnTime)}'` : 'NULL'}, ${data.distance || 0}, '${data.status || 'dispatched'}', '${data.priority || 'routine'}', ${data.notes ? `'${escapeVal(data.notes)}'` : 'NULL'}, ${data.createdBy ? `'${escapeVal(data.createdBy)}'` : 'NULL'}, '${now}')
          `
          await p.$executeRawUnsafe(sql)
          const record = { ...data, id, createdAt: now }
          logger.info('Ambulance call created', { id })
          broadcastChange('ambulanceCall_created', 'ambulanceCall', record)
          return successResponse({ data: record })
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
              type === 'routingRequest' ? 'routingRequests' :
              type === 'seedDrugs' ? 'drugs' :
              type === 'seedLabTests' ? 'labTests' :
              // New data type mappings
              type === 'bill' ? 'bills' :
              type === 'payment' ? 'payments' :
              type === 'expense' ? 'expenses' :
              type === 'inventoryItem' ? 'inventoryItems' :
              type === 'equipment' ? 'equipment' :
              type === 'patientWallet' ? 'patientWallets' :
              type === 'insuranceClaim' ? 'insuranceClaims' :
              type === 'bloodDonor' ? 'bloodDonors' :
              type === 'bloodUnit' ? 'bloodUnits' :
              type === 'medicalAsset' ? 'medicalAssets' :
              type === 'surgeryBooking' ? 'surgeryBookings' :
              type === 'immunizationRecord' ? 'immunizationRecords' :
              type === 'antenatalVisit' ? 'antenatalVisits' :
              type === 'patientTask' ? 'patientTasks' :
              type === 'staffAttendance' ? 'staffAttendances' :
              type === 'shiftSwap' ? 'shiftSwaps' :
              type === 'certification' ? 'certifications' :
              type === 'trainingRecord' ? 'trainingRecords' :
              type === 'medicationAdmin' ? 'medicationAdmins' :
              type === 'ambulanceCall' ? 'ambulanceCalls' : type

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
      const key = getKeyFromType(type)
      
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
          // Ensure columns exist
          await ensureConsultationSchema(p)
          
          // Use raw SQL for update to handle all columns
          const setClauses: string[] = []
          
          // Helper to safely escape strings
          const escapeStr = (val: any) => val ? String(val).replace(/'/g, "''") : null
          const escapeJson = (val: any) => val ? JSON.stringify(val).replace(/'/g, "''") : null
          
          // Build SET clauses dynamically - handle ALL fields from frontend
          if (data.status !== undefined) setClauses.push(`status = '${escapeStr(data.status)}'`)
          if (data.referredTo !== undefined) setClauses.push(`"referredTo" = '${escapeStr(data.referredTo)}'`)
          if (data.sendBackTo !== undefined) setClauses.push(`"sendBackTo" = '${escapeJson(data.sendBackTo)}'`)
          if (data.sendBackNotes !== undefined) setClauses.push(`"sendBackNotes" = '${escapeStr(data.sendBackNotes)}'`)
          if (data.chiefComplaint !== undefined) setClauses.push(`"chiefComplaint" = '${escapeStr(data.chiefComplaint)}'`)
          if (data.historyOfPresentIllness !== undefined) setClauses.push(`"historyOfPresentIllness" = '${escapeStr(data.historyOfPresentIllness)}'`)
          if (data.pastMedicalHistory !== undefined) setClauses.push(`"pastMedicalHistory" = '${escapeStr(data.pastMedicalHistory)}'`)
          if (data.signsAndSymptoms !== undefined) setClauses.push(`"signsAndSymptoms" = '${escapeStr(data.signsAndSymptoms)}'`)
          if (data.generalExamination !== undefined) setClauses.push(`"generalExamination" = '${escapeStr(data.generalExamination)}'`)
          if (data.systemExamination !== undefined) setClauses.push(`"systemExamination" = '${escapeStr(data.systemExamination)}'`)
          if (data.finalDiagnosis !== undefined) setClauses.push(`"finalDiagnosis" = '${escapeStr(data.finalDiagnosis)}'`)
          if (data.provisionalDiagnosis !== undefined) setClauses.push(`"provisionalDiagnosis" = '${escapeStr(data.provisionalDiagnosis)}'`)
          if (data.treatmentPlan !== undefined) setClauses.push(`"treatmentPlan" = '${escapeStr(data.treatmentPlan)}'`)
          if (data.advice !== undefined) setClauses.push(`advice = '${escapeStr(data.advice)}'`)
          if (data.followUpDate !== undefined) setClauses.push(`"followUpDate" = '${escapeStr(data.followUpDate)}'`)
          if (data.prescriptions !== undefined) setClauses.push(`prescriptions = '${escapeJson(data.prescriptions)}'`)
          if (data.prescriptionItems !== undefined) setClauses.push(`"prescriptionItems" = '${escapeJson(data.prescriptionItems)}'`)
          if (data.hasPrescription !== undefined) setClauses.push(`"hasPrescription" = ${data.hasPrescription ? 'true' : 'false'}`)
          if (data.completedAt !== undefined) setClauses.push(`"completedAt" = '${escapeStr(data.completedAt)}'`)
          if (data.reviewedAt !== undefined) setClauses.push(`"reviewedAt" = '${escapeStr(data.reviewedAt)}'`)
          if (data.sentByNurseInitials !== undefined) setClauses.push(`"sentByNurseInitials" = '${escapeStr(data.sentByNurseInitials)}'`)
          if (data.investigationsRequested !== undefined) setClauses.push(`"investigationsRequested" = '${escapeJson(data.investigationsRequested)}'`)
          if (data.scanRequested !== undefined) setClauses.push(`"scanRequested" = '${escapeJson(data.scanRequested)}'`)
          if (data.scanFindings !== undefined) setClauses.push(`"scanFindings" = '${escapeStr(data.scanFindings)}'`)
          if (data.patient !== undefined) setClauses.push(`patient = '${escapeJson(data.patient)}'`)
          if (data.bloodPressureSystolic !== undefined) setClauses.push(`"bloodPressureSystolic" = ${data.bloodPressureSystolic || 'NULL'}`)
          if (data.bloodPressureDiastolic !== undefined) setClauses.push(`"bloodPressureDiastolic" = ${data.bloodPressureDiastolic || 'NULL'}`)
          if (data.temperature !== undefined) setClauses.push(`temperature = ${data.temperature || 'NULL'}`)
          if (data.pulse !== undefined) setClauses.push(`pulse = ${data.pulse || 'NULL'}`)
          if (data.respiratoryRate !== undefined) setClauses.push(`"respiratoryRate" = ${data.respiratoryRate || 'NULL'}`)
          if (data.weight !== undefined) setClauses.push(`weight = ${data.weight || 'NULL'}`)
          if (data.height !== undefined) setClauses.push(`height = ${data.height || 'NULL'}`)
          if (data.oxygenSaturation !== undefined) setClauses.push(`"oxygenSaturation" = ${data.oxygenSaturation || 'NULL'}`)
          // Staff assignments
          if (data.assignedNurseId !== undefined) setClauses.push(`"assignedNurseId" = '${escapeStr(data.assignedNurseId) || ''}'`)
          if (data.assignedNurseName !== undefined) setClauses.push(`"assignedNurseName" = '${escapeStr(data.assignedNurseName) || ''}'`)
          if (data.assignedPharmacistId !== undefined) setClauses.push(`"assignedPharmacistId" = '${escapeStr(data.assignedPharmacistId) || ''}'`)
          if (data.assignedPharmacistName !== undefined) setClauses.push(`"assignedPharmacistName" = '${escapeStr(data.assignedPharmacistName) || ''}'`)
          if (data.assignedLabTechId !== undefined) setClauses.push(`"assignedLabTechId" = '${escapeStr(data.assignedLabTechId) || ''}'`)
          if (data.assignedLabTechName !== undefined) setClauses.push(`"assignedLabTechName" = '${escapeStr(data.assignedLabTechName) || ''}'`)
          if (data.assignedRecordsId !== undefined) setClauses.push(`"assignedRecordsId" = '${escapeStr(data.assignedRecordsId) || ''}'`)
          if (data.assignedRecordsName !== undefined) setClauses.push(`"assignedRecordsName" = '${escapeStr(data.assignedRecordsName) || ''}'`)
          if (data.doctorId !== undefined) setClauses.push(`"doctorId" = '${escapeStr(data.doctorId) || ''}'`)
          if (data.doctorName !== undefined) setClauses.push(`"doctorName" = '${escapeStr(data.doctorName) || ''}'`)
          if (data.doctorInitials !== undefined) setClauses.push(`"doctorInitials" = '${escapeStr(data.doctorInitials) || ''}'`)
          
          setClauses.push(`"updatedAt" = '${new Date().toISOString()}'`)
          
          if (setClauses.length > 1) {
            const sql = `UPDATE consultations SET ${setClauses.join(', ')} WHERE id = '${id}'`
            console.log('[CONSULTATION UPDATE SQL]', sql.substring(0, 500))
            await p.$executeRawUnsafe(sql)
          }
          
          // Fetch updated consultation
          const consultations = await p.$queryRawUnsafe(`
            SELECT * FROM consultations WHERE id = '${id}'
          `)
          const consultation = Array.isArray(consultations) ? consultations[0] : null
          
          logger.info('Consultation updated', { consultationId: id, status: data.status, sendBackTo: data.sendBackTo })
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

        // New data types using raw SQL for updates
        case 'bill': {
          await ensureTableExists(p, 'bills', TABLE_CREATE_SQL.bills)
          const setClauses = buildUpdateClauses(data, ['patient', 'items'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE bills SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM bills WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('bill_updated', 'bill', record)
          return successResponse({ data: record })
        }

        case 'payment': {
          await ensureTableExists(p, 'payments', TABLE_CREATE_SQL.payments)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE payments SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM payments WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('payment_updated', 'payment', record)
          return successResponse({ data: record })
        }

        case 'expense': {
          await ensureTableExists(p, 'expenses', TABLE_CREATE_SQL.expenses)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE expenses SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM expenses WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('expense_updated', 'expense', record)
          return successResponse({ data: record })
        }

        case 'inventoryItem': {
          await ensureTableExists(p, 'inventory_items', TABLE_CREATE_SQL.inventory_items)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE inventory_items SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM inventory_items WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('inventoryItem_updated', 'inventoryItem', record)
          return successResponse({ data: record })
        }

        case 'equipment': {
          await ensureTableExists(p, 'equipment', TABLE_CREATE_SQL.equipment)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE equipment SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM equipment WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('equipment_updated', 'equipment', record)
          return successResponse({ data: record })
        }

        case 'patientWallet': {
          await ensureTableExists(p, 'patient_wallets', TABLE_CREATE_SQL.patient_wallets)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE patient_wallets SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('patientWallet_updated', 'patientWallet', record)
          return successResponse({ data: record })
        }

        case 'insuranceClaim': {
          await ensureTableExists(p, 'insurance_claims', TABLE_CREATE_SQL.insurance_claims)
          const setClauses = buildUpdateClauses(data, ['patient', 'services'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE insurance_claims SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM insurance_claims WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('insuranceClaim_updated', 'insuranceClaim', record)
          return successResponse({ data: record })
        }

        case 'bloodDonor': {
          await ensureTableExists(p, 'blood_donors', TABLE_CREATE_SQL.blood_donors)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE blood_donors SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM blood_donors WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('bloodDonor_updated', 'bloodDonor', record)
          return successResponse({ data: record })
        }

        case 'bloodUnit': {
          await ensureTableExists(p, 'blood_units', TABLE_CREATE_SQL.blood_units)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE blood_units SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM blood_units WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('bloodUnit_updated', 'bloodUnit', record)
          return successResponse({ data: record })
        }

        case 'medicalAsset': {
          await ensureTableExists(p, 'medical_assets', TABLE_CREATE_SQL.medical_assets)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE medical_assets SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM medical_assets WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('medicalAsset_updated', 'medicalAsset', record)
          return successResponse({ data: record })
        }

        case 'surgeryBooking': {
          await ensureTableExists(p, 'surgery_bookings', TABLE_CREATE_SQL.surgery_bookings)
          const setClauses = buildUpdateClauses(data, ['patient', 'preOpChecklist'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE surgery_bookings SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM surgery_bookings WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('surgeryBooking_updated', 'surgeryBooking', record)
          return successResponse({ data: record })
        }

        case 'immunizationRecord': {
          await ensureTableExists(p, 'immunization_records', TABLE_CREATE_SQL.immunization_records)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE immunization_records SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM immunization_records WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('immunizationRecord_updated', 'immunizationRecord', record)
          return successResponse({ data: record })
        }

        case 'antenatalVisit': {
          await ensureTableExists(p, 'antenatal_visits', TABLE_CREATE_SQL.antenatal_visits)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE antenatal_visits SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM antenatal_visits WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('antenatalVisit_updated', 'antenatalVisit', record)
          return successResponse({ data: record })
        }

        case 'patientTask': {
          await ensureTableExists(p, 'patient_tasks', TABLE_CREATE_SQL.patient_tasks)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE patient_tasks SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM patient_tasks WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('patientTask_updated', 'patientTask', record)
          return successResponse({ data: record })
        }

        case 'staffAttendance': {
          await ensureTableExists(p, 'staff_attendances', TABLE_CREATE_SQL.staff_attendances)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE staff_attendances SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM staff_attendances WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('staffAttendance_updated', 'staffAttendance', record)
          return successResponse({ data: record })
        }

        case 'shiftSwap': {
          await ensureTableExists(p, 'shift_swaps', TABLE_CREATE_SQL.shift_swaps)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE shift_swaps SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM shift_swaps WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('shiftSwap_updated', 'shiftSwap', record)
          return successResponse({ data: record })
        }

        case 'certification': {
          await ensureTableExists(p, 'certifications', TABLE_CREATE_SQL.certifications)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE certifications SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM certifications WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('certification_updated', 'certification', record)
          return successResponse({ data: record })
        }

        case 'trainingRecord': {
          await ensureTableExists(p, 'training_records', TABLE_CREATE_SQL.training_records)
          const setClauses = buildUpdateClauses(data)
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE training_records SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM training_records WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('trainingRecord_updated', 'trainingRecord', record)
          return successResponse({ data: record })
        }

        case 'medicationAdmin': {
          await ensureTableExists(p, 'medication_administrations', TABLE_CREATE_SQL.medication_administrations)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE medication_administrations SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM medication_administrations WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('medicationAdmin_updated', 'medicationAdmin', record)
          return successResponse({ data: record })
        }

        case 'ambulanceCall': {
          await ensureTableExists(p, 'ambulance_calls', TABLE_CREATE_SQL.ambulance_calls)
          const setClauses = buildUpdateClauses(data, ['patient'])
          if (setClauses.length > 0) {
            await p.$executeRawUnsafe(`UPDATE ambulance_calls SET ${setClauses.join(', ')} WHERE id = '${id}'`)
          }
          const records = await p.$queryRawUnsafe(`SELECT * FROM ambulance_calls WHERE id = '${id}'`)
          const record = Array.isArray(records) ? records[0] : null
          broadcastChange('ambulanceCall_updated', 'ambulanceCall', record)
          return successResponse({ data: record })
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

// Helper function to get key from type for demo mode
function getKeyFromType(type: string): string {
  const mapping: Record<string, string> = {
    labRequest: 'labRequests',
    labResult: 'labResults',
    queueEntry: 'queueEntries',
    medicalCertificate: 'medicalCertificates',
    referralLetter: 'referralLetters',
    dischargeSummary: 'dischargeSummaries',
    voiceNote: 'voiceNotes',
    routingRequest: 'routingRequests',
    bill: 'bills',
    payment: 'payments',
    expense: 'expenses',
    inventoryItem: 'inventoryItems',
    equipment: 'equipment',
    patientWallet: 'patientWallets',
    insuranceClaim: 'insuranceClaims',
    bloodDonor: 'bloodDonors',
    bloodUnit: 'bloodUnits',
    medicalAsset: 'medicalAssets',
    surgeryBooking: 'surgeryBookings',
    immunizationRecord: 'immunizationRecords',
    antenatalVisit: 'antenatalVisits',
    patientTask: 'patientTasks',
    staffAttendance: 'staffAttendances',
    shiftSwap: 'shiftSwaps',
    certification: 'certifications',
    trainingRecord: 'trainingRecords',
    medicationAdmin: 'medicationAdmins',
    ambulanceCall: 'ambulanceCalls'
  }
  return mapping[type] || type
}

// Helper function to build UPDATE SET clauses
function buildUpdateClauses(data: any, jsonFields: string[] = []): string[] {
  const clauses: string[] = []
  const now = new Date().toISOString()
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || key === 'id') continue
    
    const column = key.replace(/([A-Z])/g, '"$1"').replace(/^"/, '') // Convert camelCase to "camelCase"
    const quotedKey = `"${key}"`
    
    if (jsonFields.includes(key)) {
      clauses.push(`${quotedKey} = '${JSON.stringify(value).replace(/'/g, "''")}'`)
    } else if (typeof value === 'string') {
      clauses.push(`${quotedKey} = '${escapeVal(value)}'`)
    } else if (typeof value === 'number') {
      clauses.push(`${quotedKey} = ${value}`)
    } else if (typeof value === 'boolean') {
      clauses.push(`${quotedKey} = ${value ? 1 : 0}`)
    } else if (value === null) {
      clauses.push(`${quotedKey} = NULL`)
    } else {
      clauses.push(`${quotedKey} = '${JSON.stringify(value).replace(/'/g, "''")}'`)
    }
  }
  
  clauses.push(`"updatedAt" = '${now}'`)
  return clauses
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
      const key = getKeyFromType(type)
      
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

        // New data types using raw SQL for delete
        case 'bill':
          await ensureTableExists(p, 'bills', TABLE_CREATE_SQL.bills)
          await p.$executeRawUnsafe(`DELETE FROM bills WHERE id = '${id}'`)
          broadcastChange('bill_deleted', 'bill', { id })
          break
        case 'payment':
          await ensureTableExists(p, 'payments', TABLE_CREATE_SQL.payments)
          await p.$executeRawUnsafe(`DELETE FROM payments WHERE id = '${id}'`)
          broadcastChange('payment_deleted', 'payment', { id })
          break
        case 'expense':
          await ensureTableExists(p, 'expenses', TABLE_CREATE_SQL.expenses)
          await p.$executeRawUnsafe(`DELETE FROM expenses WHERE id = '${id}'`)
          broadcastChange('expense_deleted', 'expense', { id })
          break
        case 'inventoryItem':
          await ensureTableExists(p, 'inventory_items', TABLE_CREATE_SQL.inventory_items)
          await p.$executeRawUnsafe(`UPDATE inventory_items SET "isActive" = 0 WHERE id = '${id}'`)
          broadcastChange('inventoryItem_deleted', 'inventoryItem', { id })
          break
        case 'equipment':
          await ensureTableExists(p, 'equipment', TABLE_CREATE_SQL.equipment)
          await p.$executeRawUnsafe(`DELETE FROM equipment WHERE id = '${id}'`)
          broadcastChange('equipment_deleted', 'equipment', { id })
          break
        case 'patientWallet':
          await ensureTableExists(p, 'patient_wallets', TABLE_CREATE_SQL.patient_wallets)
          await p.$executeRawUnsafe(`UPDATE patient_wallets SET "isActive" = 0 WHERE id = '${id}'`)
          broadcastChange('patientWallet_deleted', 'patientWallet', { id })
          break
        case 'insuranceClaim':
          await ensureTableExists(p, 'insurance_claims', TABLE_CREATE_SQL.insurance_claims)
          await p.$executeRawUnsafe(`DELETE FROM insurance_claims WHERE id = '${id}'`)
          broadcastChange('insuranceClaim_deleted', 'insuranceClaim', { id })
          break
        case 'bloodDonor':
          await ensureTableExists(p, 'blood_donors', TABLE_CREATE_SQL.blood_donors)
          await p.$executeRawUnsafe(`DELETE FROM blood_donors WHERE id = '${id}'`)
          broadcastChange('bloodDonor_deleted', 'bloodDonor', { id })
          break
        case 'bloodUnit':
          await ensureTableExists(p, 'blood_units', TABLE_CREATE_SQL.blood_units)
          await p.$executeRawUnsafe(`DELETE FROM blood_units WHERE id = '${id}'`)
          broadcastChange('bloodUnit_deleted', 'bloodUnit', { id })
          break
        case 'medicalAsset':
          await ensureTableExists(p, 'medical_assets', TABLE_CREATE_SQL.medical_assets)
          await p.$executeRawUnsafe(`DELETE FROM medical_assets WHERE id = '${id}'`)
          broadcastChange('medicalAsset_deleted', 'medicalAsset', { id })
          break
        case 'surgeryBooking':
          await ensureTableExists(p, 'surgery_bookings', TABLE_CREATE_SQL.surgery_bookings)
          await p.$executeRawUnsafe(`DELETE FROM surgery_bookings WHERE id = '${id}'`)
          broadcastChange('surgeryBooking_deleted', 'surgeryBooking', { id })
          break
        case 'immunizationRecord':
          await ensureTableExists(p, 'immunization_records', TABLE_CREATE_SQL.immunization_records)
          await p.$executeRawUnsafe(`DELETE FROM immunization_records WHERE id = '${id}'`)
          broadcastChange('immunizationRecord_deleted', 'immunizationRecord', { id })
          break
        case 'antenatalVisit':
          await ensureTableExists(p, 'antenatal_visits', TABLE_CREATE_SQL.antenatal_visits)
          await p.$executeRawUnsafe(`DELETE FROM antenatal_visits WHERE id = '${id}'`)
          broadcastChange('antenatalVisit_deleted', 'antenatalVisit', { id })
          break
        case 'patientTask':
          await ensureTableExists(p, 'patient_tasks', TABLE_CREATE_SQL.patient_tasks)
          await p.$executeRawUnsafe(`DELETE FROM patient_tasks WHERE id = '${id}'`)
          broadcastChange('patientTask_deleted', 'patientTask', { id })
          break
        case 'staffAttendance':
          await ensureTableExists(p, 'staff_attendances', TABLE_CREATE_SQL.staff_attendances)
          await p.$executeRawUnsafe(`DELETE FROM staff_attendances WHERE id = '${id}'`)
          broadcastChange('staffAttendance_deleted', 'staffAttendance', { id })
          break
        case 'shiftSwap':
          await ensureTableExists(p, 'shift_swaps', TABLE_CREATE_SQL.shift_swaps)
          await p.$executeRawUnsafe(`DELETE FROM shift_swaps WHERE id = '${id}'`)
          broadcastChange('shiftSwap_deleted', 'shiftSwap', { id })
          break
        case 'certification':
          await ensureTableExists(p, 'certifications', TABLE_CREATE_SQL.certifications)
          await p.$executeRawUnsafe(`DELETE FROM certifications WHERE id = '${id}'`)
          broadcastChange('certification_deleted', 'certification', { id })
          break
        case 'trainingRecord':
          await ensureTableExists(p, 'training_records', TABLE_CREATE_SQL.training_records)
          await p.$executeRawUnsafe(`DELETE FROM training_records WHERE id = '${id}'`)
          broadcastChange('trainingRecord_deleted', 'trainingRecord', { id })
          break
        case 'medicationAdmin':
          await ensureTableExists(p, 'medication_administrations', TABLE_CREATE_SQL.medication_administrations)
          await p.$executeRawUnsafe(`DELETE FROM medication_administrations WHERE id = '${id}'`)
          broadcastChange('medicationAdmin_deleted', 'medicationAdmin', { id })
          break
        case 'ambulanceCall':
          await ensureTableExists(p, 'ambulance_calls', TABLE_CREATE_SQL.ambulance_calls)
          await p.$executeRawUnsafe(`DELETE FROM ambulance_calls WHERE id = '${id}'`)
          broadcastChange('ambulanceCall_deleted', 'ambulanceCall', { id })
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
