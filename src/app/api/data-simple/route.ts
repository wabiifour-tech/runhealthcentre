// Simple Data API - Direct PostgreSQL connection
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create pool directly - same approach as working db-check endpoint
function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 10000,
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  
  const pool = createPool()
  
  try {
    if (type === 'users') {
      const result = await pool.query(`
        SELECT id, email, name, role, department, initials, phone, "dateOfBirth", 
               "isActive", "isFirstLogin", "approvalStatus", "createdAt"
        FROM users 
        ORDER BY "createdAt" DESC
      `)
      await pool.end()
      return NextResponse.json({ success: true, data: result.rows })
    }
    
    if (type === 'all') {
      // Fetch all essential data with error handling for each query
      const safeQuery = async (sql: string) => {
        try {
          const res = await pool.query(sql)
          return res.rows
        } catch {
          return []
        }
      }
      
      const [users, patients, drugs, labTests, vitals, consultations, queueEntries, appointments] = await Promise.all([
        safeQuery(`SELECT id, email, name, role, department, initials, phone, "dateOfBirth", "isActive", "isFirstLogin", "approvalStatus", "createdAt" FROM users ORDER BY "createdAt" DESC`),
        safeQuery(`SELECT * FROM patients ORDER BY "registeredAt" DESC`),
        safeQuery(`SELECT * FROM drugs WHERE "isActive" = true ORDER BY name ASC`),
        safeQuery(`SELECT * FROM lab_tests WHERE "isActive" = true ORDER BY name ASC`),
        safeQuery(`SELECT * FROM vital_signs ORDER BY "recordedAt" DESC`),
        safeQuery(`SELECT * FROM consultations ORDER BY "createdAt" DESC`),
        safeQuery(`SELECT * FROM queue_entries ORDER BY "checkedInAt" DESC`),
        safeQuery(`SELECT * FROM appointments ORDER BY "createdAt" DESC`),
      ])
      
      await pool.end()
      
      return NextResponse.json({
        success: true,
        data: {
          users,
          patients,
          drugs,
          labTests,
          vitals,
          consultations,
          queueEntries,
          appointments,
          admissions: [],
          prescriptions: [],
          labRequests: [],
          labResults: [],
          medicalCertificates: [],
          referralLetters: [],
          dischargeSummaries: [],
          announcements: [],
          voiceNotes: [],
          auditLogs: [],
          rosters: [],
          attendance: [],
          routingRequests: [],
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
    
    // Generic query for specific type
    const tableMap: Record<string, string> = {
      patients: 'patients',
      users: 'users',
      drugs: 'drugs',
      labTests: 'lab_tests',
      vitals: 'vital_signs',
      consultations: 'consultations',
      appointments: 'appointments',
      queueEntries: 'queue_entries',
      admissions: 'admissions',
      prescriptions: 'prescriptions',
      labRequests: 'lab_requests',
      labResults: 'lab_results',
    }
    
    const table = tableMap[type]
    if (!table) {
      await pool.end()
      return NextResponse.json({ success: true, data: [] })
    }
    
    const result = await pool.query(`SELECT * FROM "${table}" ORDER BY "createdAt" DESC LIMIT 500`)
    
    await pool.end()
    return NextResponse.json({ success: true, data: result.rows })
    
  } catch (error: any) {
    try { await pool.end() } catch {}
    return NextResponse.json({
      success: false,
      error: error.message,
      code: 'DATABASE_ERROR'
    }, { status: 500 })
  }
}
