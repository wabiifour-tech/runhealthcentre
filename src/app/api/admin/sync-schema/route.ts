// Admin API to sync database schema - Creates missing tables and columns
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer ruhc-admin-sync-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getPrisma } = await import('@/lib/db')
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const p = prisma as any
    const results: any[] = []

    // First, add missing columns to existing tables
    const alterTableStatements = [
      { table: 'users', column: 'profilePhoto', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT` },
      { table: 'users', column: 'phone', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "phone" TEXT` },
      { table: 'users', column: 'dateOfBirth', type: 'TIMESTAMP', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3)` },
      { table: 'users', column: 'department', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "department" TEXT` },
      { table: 'users', column: 'initials', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "initials" TEXT` },
      { table: 'users', column: 'lastLogin', type: 'TIMESTAMP', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3)` },
      { table: 'users', column: 'updatedAt', type: 'TIMESTAMP', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` },
      // New columns for multi-step registration and approval system
      { table: 'users', column: 'firstName', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" TEXT` },
      { table: 'users', column: 'lastName', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" TEXT` },
      { table: 'users', column: 'approvalStatus', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING'` },
      { table: 'users', column: 'approvedBy', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvedBy" TEXT` },
      { table: 'users', column: 'approvedAt', type: 'TIMESTAMP', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3)` },
      { table: 'users', column: 'rememberToken', type: 'TEXT', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "rememberToken" TEXT` },
      { table: 'users', column: 'tokenExpiresAt', type: 'TIMESTAMP', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3)` },
      // Routing requests missing columns
      { table: 'routing_requests', column: 'purpose', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS purpose TEXT` },
      { table: 'routing_requests', column: 'lab_request_id', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS lab_request_id TEXT` },
      { table: 'routing_requests', column: 'prescription_id', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS prescription_id TEXT` },
      { table: 'routing_requests', column: 'acknowledged_at', type: 'TIMESTAMP', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP(3)` },
      { table: 'routing_requests', column: 'acknowledged_by', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS acknowledged_by TEXT` },
      { table: 'routing_requests', column: 'completed_at', type: 'TIMESTAMP', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP(3)` },
      { table: 'routing_requests', column: 'completed_by', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS completed_by TEXT` },
      { table: 'routing_requests', column: 'completion_notes', type: 'TEXT', sql: `ALTER TABLE routing_requests ADD COLUMN IF NOT EXISTS completion_notes TEXT` },
      // Notifications table missing columns
      { table: 'notifications', column: 'targetRoles', type: 'TEXT', sql: `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "targetRoles" TEXT` },
      { table: 'notifications', column: 'priority', type: 'TEXT', sql: `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'` },
      { table: 'notifications', column: 'read', type: 'BOOLEAN', sql: `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE` },
    ]

    for (const alter of alterTableStatements) {
      try {
        await p.$executeRawUnsafe(alter.sql)
        results.push({ type: 'alter', table: alter.table, column: alter.column, status: 'added/verified' })
      } catch (e: any) {
        if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
          results.push({ type: 'alter', table: alter.table, column: alter.column, status: 'error', message: e.message })
        } else {
          results.push({ type: 'alter', table: alter.table, column: alter.column, status: 'already_exists' })
        }
      }
    }

    // Create all tables (IF NOT EXISTS)
    const tables = [
      { name: 'users', sql: `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL,
        role TEXT NOT NULL, department TEXT, initials TEXT, phone TEXT, "dateOfBirth" TIMESTAMP(3),
        "profilePhoto" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
        "firstName" TEXT, "lastName" TEXT,
        "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING', "approvedBy" TEXT, "approvedAt" TIMESTAMP(3),
        "rememberToken" TEXT, "tokenExpiresAt" TIMESTAMP(3),
        "lastLogin" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'patients', sql: `CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY, "hospitalNumber" TEXT, "ruhcCode" TEXT UNIQUE NOT NULL, "matricNumber" TEXT,
        "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "middleName" TEXT, title TEXT, "dateOfBirth" TEXT,
        gender TEXT, "bloodGroup" TEXT, genotype TEXT, phone TEXT, email TEXT, address TEXT, city TEXT,
        state TEXT, lga TEXT, nationality TEXT, religion TEXT, occupation TEXT, "maritalStatus" TEXT,
        "nokName" TEXT, "nokRelationship" TEXT, "nokPhone" TEXT, "nokAddress" TEXT,
        "emergencyContactName" TEXT, "emergencyContactPhone" TEXT, "emergencyContactRelationship" TEXT,
        "insuranceNumber" TEXT, "insuranceProvider" TEXT, allergies TEXT, "chronicConditions" TEXT,
        "currentMedications" TEXT, "currentUnit" TEXT, "bedNumber" INTEGER, "admissionDate" TIMESTAMP(3),
        "dischargeDate" TIMESTAMP(3), "isActive" BOOLEAN NOT NULL DEFAULT true,
        "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "registeredBy" TEXT,
        "lastEditedBy" TEXT, "lastEditedAt" TIMESTAMP(3))` },
      { name: 'consultations', sql: `CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "doctorId" TEXT, "doctorName" TEXT,
        status TEXT NOT NULL DEFAULT 'pending', "chiefComplaint" TEXT, "historyOfPresentIllness" TEXT,
        "pastMedicalHistory" TEXT, "signsAndSymptoms" TEXT, "bloodPressureSystolic" TEXT,
        "bloodPressureDiastolic" TEXT, temperature TEXT, pulse TEXT, "respiratoryRate" TEXT,
        weight TEXT, height TEXT, "oxygenSaturation" TEXT, "generalExamination" TEXT,
        "systemExamination" TEXT, "investigationsRequested" JSONB, "scanRequested" JSONB,
        "scanFindings" TEXT, "provisionalDiagnosis" TEXT, "finalDiagnosis" TEXT, "treatmentPlan" TEXT,
        prescriptions JSONB, "referralTo" TEXT, "referralNotes" TEXT, "sendBackTo" JSONB,
        "sendBackNotes" TEXT, "sentAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'vital_signs', sql: `CREATE TABLE IF NOT EXISTS vital_signs (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "recordedBy" TEXT,
        "bloodPressureSystolic" TEXT, "bloodPressureDiastolic" TEXT, temperature TEXT, pulse TEXT,
        "respiratoryRate" TEXT, weight TEXT, height TEXT, "oxygenSaturation" TEXT, "painScore" TEXT,
        notes TEXT, "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'lab_requests', sql: `CREATE TABLE IF NOT EXISTS lab_requests (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "requestedBy" TEXT, tests JSONB,
        status TEXT NOT NULL DEFAULT 'pending', notes TEXT,
        "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3))` },
      { name: 'lab_results', sql: `CREATE TABLE IF NOT EXISTS lab_results (
        id TEXT PRIMARY KEY, "requestId" TEXT, "patientId" TEXT, patient JSONB, "testName" TEXT,
        result TEXT, notes TEXT, "performedBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'prescriptions', sql: `CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "prescribedBy" TEXT, medications JSONB,
        status TEXT NOT NULL DEFAULT 'pending', notes TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dispensedAt" TIMESTAMP(3))` },
      { name: 'queue_entries', sql: `CREATE TABLE IF NOT EXISTS queue_entries (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, unit TEXT, status TEXT NOT NULL DEFAULT 'waiting',
        priority INTEGER NOT NULL DEFAULT 0, notes TEXT,
        "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "seenAt" TIMESTAMP(3))` },
      { name: 'appointments', sql: `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "doctorId" TEXT, "doctorName" TEXT,
        type TEXT, reason TEXT, "appointmentDate" TEXT, "startTime" TEXT, "endTime" TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, initials TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'admissions', sql: `CREATE TABLE IF NOT EXISTS admissions (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, unit TEXT, "bedNumber" INTEGER,
        reason TEXT, status TEXT NOT NULL DEFAULT 'admitted',
        "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dischargedAt" TIMESTAMP(3),
        notes TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'drugs', sql: `CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, "dosageForm" TEXT, strength TEXT,
        unit TEXT, price DOUBLE PRECISION, "quantityInStock" INTEGER NOT NULL DEFAULT 0,
        "reorderLevel" INTEGER NOT NULL DEFAULT 10, "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'lab_tests', sql: `CREATE TABLE IF NOT EXISTS lab_tests (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, price DOUBLE PRECISION,
        "turnaroundTime" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'announcements', sql: `CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, type TEXT NOT NULL DEFAULT 'general',
        "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'voice_notes', sql: `CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "recipientRole" TEXT,
        transcription TEXT, "audioUrl" TEXT, initials TEXT, "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'medical_certificates', sql: `CREATE TABLE IF NOT EXISTS medical_certificates (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, type TEXT, diagnosis TEXT,
        "daysOff" INTEGER, "startDate" TEXT, "endDate" TEXT, notes TEXT, "issuedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'referral_letters', sql: `CREATE TABLE IF NOT EXISTS referral_letters (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "referredTo" TEXT, reason TEXT,
        diagnosis TEXT, notes TEXT, "issuedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'discharge_summaries', sql: `CREATE TABLE IF NOT EXISTS discharge_summaries (
        id TEXT PRIMARY KEY, "patientId" TEXT, patient JSONB, "admissionDate" TEXT,
        "dischargeDate" TEXT, diagnosis TEXT, treatment TEXT, medications TEXT, "followUp" TEXT,
        notes TEXT, "dischargedBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'audit_logs', sql: `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, "userId" TEXT, "userName" TEXT, action TEXT NOT NULL,
        description TEXT, metadata JSONB, timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'rosters', sql: `CREATE TABLE IF NOT EXISTS rosters (
        id TEXT PRIMARY KEY, "staffId" TEXT, "staffName" TEXT, "staffRole" TEXT, date TEXT NOT NULL,
        shift TEXT NOT NULL, notes TEXT, "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      { name: 'attendance', sql: `CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, "staffId" TEXT, "staffName" TEXT, "staffRole" TEXT, date TEXT NOT NULL,
        "signInTime" TEXT, "signInPhoto" TEXT, "signOutTime" TEXT, "signOutPhoto" TEXT,
        shift TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'present', "deviceId" TEXT, notes TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)` },
      // Routing requests table for cross-department communication
      { name: 'routing_requests', sql: `CREATE TABLE IF NOT EXISTS routing_requests (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL, sender_name TEXT NOT NULL, sender_role TEXT NOT NULL, sender_initials TEXT,
        receiver_id TEXT, receiver_name TEXT, receiver_role TEXT, receiver_department TEXT,
        patient_id TEXT, patient_name TEXT, patient_hospital_number TEXT,
        request_type TEXT NOT NULL, priority TEXT DEFAULT 'routine', purpose TEXT,
        subject TEXT NOT NULL, message TEXT, notes TEXT,
        consultation_id TEXT, lab_request_id TEXT, prescription_id TEXT,
        status TEXT DEFAULT 'pending', acknowledged_at TIMESTAMP(3), acknowledged_by TEXT,
        completed_at TIMESTAMP(3), completed_by TEXT, completion_notes TEXT,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP)` },
      // Notifications table for role-based notifications
      { name: 'notifications', sql: `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        "userId" TEXT, "targetRoles" TEXT,
        type TEXT, title TEXT, message TEXT,
        data JSONB, priority TEXT DEFAULT 'normal',
        read BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP)` }
    ]

    for (const table of tables) {
      try {
        await p.$executeRawUnsafe(table.sql)
        results.push({ table: table.name, status: 'ok' })
      } catch (e: any) {
        results.push({ table: table.name, status: 'error', message: e.message })
      }
    }

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
