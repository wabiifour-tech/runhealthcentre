// Simple Data API - Direct PostgreSQL connection for RUHC HMS
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { createLogger } from '@/lib/logger'

const logger = createLogger('DataAPI')

// Create pool directly - same approach as working db-check endpoint
function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 10000,
  })
}

// Safe query helper
async function safeQuery(pool: Pool, sql: string): Promise<any[]> {
  try {
    const res = await pool.query(sql)
    return res.rows
  } catch (error: any) {
    logger.debug(`Query failed: ${sql.substring(0, 50)}...`, { error: error.message })
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const id = searchParams.get('id')
  
  const pool = createPool()
  
  try {
    logger.info(`Data API request: type=${type}`)
    
    if (type === 'users') {
      const users = await safeQuery(pool, `
        SELECT id, email, name, role, department, initials, phone, "dateOfBirth", 
               "profilePhoto", "isActive", "isFirstLogin", "approvalStatus", "createdAt"
        FROM users 
        ORDER BY "createdAt" DESC
      `)
      await pool.end()
      return NextResponse.json({ success: true, data: users })
    }
    
    if (type === 'patients') {
      const patients = await safeQuery(pool, `SELECT * FROM patients ORDER BY "registeredAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: patients })
    }
    
    if (type === 'drugs') {
      const drugs = await safeQuery(pool, `SELECT * FROM drugs WHERE "isActive" = true ORDER BY name ASC`)
      await pool.end()
      return NextResponse.json({ success: true, data: drugs })
    }
    
    if (type === 'labTests') {
      const labTests = await safeQuery(pool, `SELECT * FROM lab_tests WHERE "isActive" = true ORDER BY name ASC`)
      await pool.end()
      return NextResponse.json({ success: true, data: labTests })
    }
    
    if (type === 'vitals') {
      const vitals = await safeQuery(pool, `SELECT * FROM vital_signs ORDER BY "recordedAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: vitals })
    }
    
    if (type === 'consultations') {
      const consultations = await safeQuery(pool, `SELECT * FROM consultations ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: consultations })
    }
    
    if (type === 'queueEntries') {
      const queueEntries = await safeQuery(pool, `SELECT * FROM queue_entries ORDER BY "checkedInAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: queueEntries })
    }
    
    if (type === 'appointments') {
      const appointments = await safeQuery(pool, `SELECT * FROM appointments ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: appointments })
    }
    
    if (type === 'admissions') {
      const admissions = await safeQuery(pool, `SELECT * FROM admissions ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: admissions })
    }
    
    if (type === 'prescriptions') {
      const prescriptions = await safeQuery(pool, `SELECT * FROM prescriptions ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: prescriptions })
    }
    
    if (type === 'labRequests') {
      const labRequests = await safeQuery(pool, `SELECT * FROM lab_requests ORDER BY "requestedAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: labRequests })
    }
    
    if (type === 'labResults') {
      const labResults = await safeQuery(pool, `SELECT * FROM lab_results ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: labResults })
    }
    
    if (type === 'announcements') {
      const announcements = await safeQuery(pool, `SELECT * FROM announcements ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: announcements })
    }
    
    if (type === 'rosters') {
      const rosters = await safeQuery(pool, `SELECT * FROM rosters ORDER BY date DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: rosters })
    }
    
    if (type === 'attendance') {
      const attendance = await safeQuery(pool, `SELECT * FROM attendance ORDER BY "createdAt" DESC`)
      await pool.end()
      return NextResponse.json({ success: true, data: attendance })
    }
    
    if (type === 'routingRequests') {
      const routingRequests = await safeQuery(pool, `SELECT * FROM routing_requests ORDER BY created_at DESC LIMIT 200`)
      await pool.end()
      return NextResponse.json({ success: true, data: routingRequests })
    }
    
    if (type === 'all') {
      // Fetch all data in parallel
      const [
        users, patients, drugs, labTests, vitals, consultations, 
        queueEntries, appointments, admissions, prescriptions,
        labRequests, labResults, medicalCertificates, referralLetters,
        dischargeSummaries, announcements, voiceNotes, rosters, attendance, routingRequests
      ] = await Promise.all([
        safeQuery(pool, `SELECT id, email, name, role, department, initials, phone, "dateOfBirth", "profilePhoto", "isActive", "isFirstLogin", "approvalStatus", "createdAt" FROM users ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM patients ORDER BY "registeredAt" DESC`),
        safeQuery(pool, `SELECT * FROM drugs WHERE "isActive" = true ORDER BY name ASC`),
        safeQuery(pool, `SELECT * FROM lab_tests WHERE "isActive" = true ORDER BY name ASC`),
        safeQuery(pool, `SELECT * FROM vital_signs ORDER BY "recordedAt" DESC`),
        safeQuery(pool, `SELECT * FROM consultations ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM queue_entries ORDER BY "checkedInAt" DESC`),
        safeQuery(pool, `SELECT * FROM appointments ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM admissions ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM prescriptions ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM lab_requests ORDER BY "requestedAt" DESC`),
        safeQuery(pool, `SELECT * FROM lab_results ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM medical_certificates ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM referral_letters ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM discharge_summaries ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM announcements ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM voice_notes ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM rosters ORDER BY date DESC`),
        safeQuery(pool, `SELECT * FROM attendance ORDER BY "createdAt" DESC`),
        safeQuery(pool, `SELECT * FROM routing_requests ORDER BY created_at DESC LIMIT 200`),
      ])
      
      await pool.end()
      
      logger.info(`Data API success: ${users.length} users, ${patients.length} patients`)
      
      return NextResponse.json({
        success: true,
        data: {
          users, patients, drugs, labTests, vitals, consultations,
          queueEntries, appointments, admissions, prescriptions,
          labRequests, labResults, medicalCertificates, referralLetters,
          dischargeSummaries, announcements, voiceNotes, rosters, attendance, routingRequests,
          auditLogs: [],
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
        }
      })
    }
    
    // Unknown type - return empty
    await pool.end()
    return NextResponse.json({ success: true, data: [] })
    
  } catch (error: any) {
    try { await pool.end() } catch {}
    logger.error('Data API error', { error: error.message })
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'DATABASE_ERROR'
    }, { status: 500 })
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  const pool = createPool()
  let recordType = 'unknown'
  
  try {
    const body = await request.json()
    const { type, data } = body
    recordType = type || 'unknown'
    
    if (!type || !data) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Type and data are required' }, { status: 400 })
    }
    
    const tableMap: Record<string, string> = {
      patient: 'patients',
      consultation: 'consultations',
      vital: 'vital_signs',
      queueEntry: 'queue_entries',
      appointment: 'appointments',
      prescription: 'prescriptions',
      labRequest: 'lab_requests',
      labResult: 'lab_results',
      announcement: 'announcements',
      voiceNote: 'voice_notes',
      admission: 'admissions',
      medicationAdministration: 'medication_administrations',
    }
    
    const table = tableMap[type]
    if (!table) {
      await pool.end()
      return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 })
    }
    
    // Remove fields that don't exist in database
    if (type === 'consultation') {
      delete data.hasPrescription
      delete data.reviewedAt
      delete data.patient // Nested object - not a column
      delete data.doctorName // Not a column
      delete data.doctorInitials // Not a column
      delete data.prescription // Not a column
      delete data.prescriptionItems // Not a column
      delete data.advice // Not a column
      delete data.followUpDate // Not a column
      delete data.assignedNurseId // Not a column
      delete data.assignedNurseName // Not a column
      delete data.assignedPharmacistId // Not a column
      delete data.assignedPharmacistName // Not a column
      delete data.assignedLabTechId // Not a column
      delete data.assignedLabTechName // Not a column
      delete data.assignedRecordsId // Not a column
      delete data.assignedRecordsName // Not a column
      delete data.patientType // Not a column
      delete data.wardName // Not a column
      delete data.bedNumber // Not a column
      delete data.admissionDate // Not a column
      delete data.nurseDataLockedAt // Not a column
      delete data.doctorDataLockedAt // Not a column
      delete data.completedAt // Not a column
      
      // Handle arrays - convert to JSON strings if they are arrays
      if (Array.isArray(data.investigationsRequested)) {
        data.investigationsRequested = JSON.stringify(data.investigationsRequested)
      }
      if (Array.isArray(data.scanRequested)) {
        data.scanRequested = JSON.stringify(data.scanRequested)
      }
      if (Array.isArray(data.sendBackTo)) {
        data.sendBackTo = JSON.stringify(data.sendBackTo)
      }
    }
    
    const columns = Object.keys(data).map(k => `"${k}"`).join(', ')
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(data)
    
    const result = await pool.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    )
    
    await pool.end()
    logger.info(`${type} created successfully`, { id: result.rows[0]?.id })
    return NextResponse.json({ success: true, data: result.rows[0] })
    
  } catch (error: any) {
    try { await pool.end() } catch {}
    logger.error('POST error', { type: recordType, error: error.message, detail: error.detail })
    return NextResponse.json({ success: false, error: error.message, detail: error.detail || null }, { status: 500 })
  }
}

// PUT - Update record
export async function PUT(request: NextRequest) {
  const pool = createPool()
  
  try {
    const body = await request.json()
    const { type, id, data } = body
    
    if (!type || !id || !data) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Type, id, and data are required' }, { status: 400 })
    }
    
    const tableMap: Record<string, string> = {
      patient: 'patients',
      consultation: 'consultations',
      vital: 'vital_signs',
      queueEntry: 'queue_entries',
      appointment: 'appointments',
      prescription: 'prescriptions',
      labRequest: 'lab_requests',
      labResult: 'lab_results',
      announcement: 'announcements',
      voiceNote: 'voice_notes',
      admission: 'admissions',
      medicationAdministration: 'medication_administrations',
    }
    
    const table = tableMap[type]
    if (!table) {
      await pool.end()
      return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 })
    }
    
    // Always add updatedAt
    data.updatedAt = new Date().toISOString()
    
    // Remove fields that don't exist in database
    if (type === 'consultation') {
      delete data.hasPrescription
      delete data.reviewedAt
      delete data.patient // Nested object - not a column
      delete data.doctorName // Not a column
      delete data.doctorInitials // Not a column
      delete data.prescription // Not a column
      delete data.prescriptionItems // Not a column
      delete data.advice // Not a column
      delete data.followUpDate // Not a column
      delete data.assignedNurseId // Not a column
      delete data.assignedNurseName // Not a column
      delete data.assignedPharmacistId // Not a column
      delete data.assignedPharmacistName // Not a column
      delete data.assignedLabTechId // Not a column
      delete data.assignedLabTechName // Not a column
      delete data.assignedRecordsId // Not a column
      delete data.assignedRecordsName // Not a column
      delete data.patientType // Not a column
      delete data.wardName // Not a column
      delete data.bedNumber // Not a column
      delete data.admissionDate // Not a column
      delete data.nurseDataLockedAt // Not a column
      delete data.doctorDataLockedAt // Not a column
      delete data.completedAt // Not a column
      
      // Handle arrays - convert to JSON strings if they are arrays
      if (Array.isArray(data.investigationsRequested)) {
        data.investigationsRequested = JSON.stringify(data.investigationsRequested)
      }
      if (Array.isArray(data.scanRequested)) {
        data.scanRequested = JSON.stringify(data.scanRequested)
      }
      if (Array.isArray(data.sendBackTo)) {
        data.sendBackTo = JSON.stringify(data.sendBackTo)
      }
    }
    
    const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const values = Object.values(data)
    
    const result = await pool.query(
      `UPDATE ${table} SET ${setClauses} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    )
    
    await pool.end()
    
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, data: result.rows[0] })
    
  } catch (error: any) {
    try { await pool.end() } catch {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete record
export async function DELETE(request: NextRequest) {
  const pool = createPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    
    if (!type || !id) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'Type and id are required' }, { status: 400 })
    }
    
    const tableMap: Record<string, string> = {
      patient: 'patients',
      consultation: 'consultations',
      queueEntry: 'queue_entries',
      appointment: 'appointments',
    }
    
    const table = tableMap[type]
    if (!table) {
      await pool.end()
      return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 })
    }
    
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id])
    
    await pool.end()
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    try { await pool.end() } catch {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
