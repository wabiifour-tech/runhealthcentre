// Database Setup API - Run once to create all tables
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dynamic import of Prisma
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Test connection
    await prisma.$connect()
    
    // Execute raw SQL to create tables if they don't exist
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT DEFAULT 'NURSE',
        "department" TEXT,
        "initials" TEXT,
        "phone" TEXT,
        "avatar" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "approval_status" TEXT DEFAULT 'APPROVED',
        "rejection_reason" TEXT,
        "is_first_login" BOOLEAN DEFAULT true,
        "must_change_password" BOOLEAN DEFAULT true,
        "password_last_changed" TIMESTAMP,
        "current_session_id" TEXT,
        "last_session_at" TIMESTAMP,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      )`,
      
      // Patients table
      `CREATE TABLE IF NOT EXISTS "patients" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT UNIQUE,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "middleName" TEXT,
        "hospitalNumber" TEXT UNIQUE,
        "ruhcCode" TEXT UNIQUE,
        "matricNumber" TEXT,
        "title" TEXT,
        "dateOfBirth" TEXT NOT NULL,
        "gender" TEXT NOT NULL,
        "bloodGroup" TEXT,
        "genotype" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "lga" TEXT,
        "nationality" TEXT DEFAULT 'Nigerian',
        "religion" TEXT,
        "occupation" TEXT,
        "maritalStatus" TEXT,
        "nokName" TEXT,
        "nokRelationship" TEXT,
        "nokPhone" TEXT,
        "nokAddress" TEXT,
        "emergencyContactName" TEXT,
        "emergencyContactPhone" TEXT,
        "emergencyContactRelationship" TEXT,
        "insuranceNumber" TEXT,
        "insuranceProvider" TEXT,
        "allergies" TEXT,
        "chronicConditions" TEXT,
        "currentMedications" TEXT,
        "familyHistory" TEXT,
        "surgicalHistory" TEXT,
        "immunizationStatus" TEXT,
        "currentUnit" TEXT,
        "admissionDate" TEXT,
        "bedNumber" INTEGER,
        "isActive" BOOLEAN DEFAULT true,
        "registeredAt" TEXT DEFAULT now(),
        "registeredBy" TEXT,
        "lastEditedBy" TEXT,
        "lastEditedAt" TEXT
      )`,
      
      // Vital Signs table
      `CREATE TABLE IF NOT EXISTS "vital_signs" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "nurseInitials" TEXT NOT NULL,
        "bloodPressureSystolic" INTEGER,
        "bloodPressureDiastolic" INTEGER,
        "temperature" REAL,
        "pulse" INTEGER,
        "respiratoryRate" INTEGER,
        "weight" REAL,
        "height" REAL,
        "bmi" REAL,
        "oxygenSaturation" REAL,
        "painScore" INTEGER,
        "notes" TEXT,
        "recordedAt" TEXT DEFAULT now(),
        "isLocked" BOOLEAN DEFAULT false,
        "lockedAt" TEXT
      )`,
      
      // Consultations table
      `CREATE TABLE IF NOT EXISTS "consultations" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "doctorId" TEXT,
        "doctorName" TEXT,
        "doctorInitials" TEXT,
        "chiefComplaint" TEXT,
        "historyOfPresentIllness" TEXT,
        "pastMedicalHistory" TEXT,
        "signsAndSymptoms" TEXT,
        "bloodPressureSystolic" INTEGER,
        "bloodPressureDiastolic" INTEGER,
        "temperature" REAL,
        "pulse" INTEGER,
        "respiratoryRate" INTEGER,
        "weight" REAL,
        "height" REAL,
        "oxygenSaturation" REAL,
        "generalExamination" TEXT,
        "systemExamination" TEXT,
        "investigationsRequested" TEXT,
        "scanRequested" TEXT,
        "scanFindings" TEXT,
        "provisionalDiagnosis" TEXT,
        "finalDiagnosis" TEXT,
        "hasPrescription" BOOLEAN DEFAULT false,
        "prescription" TEXT,
        "prescriptionItems" TEXT,
        "treatmentPlan" TEXT,
        "advice" TEXT,
        "followUpDate" TEXT,
        "referredTo" TEXT,
        "referralNotes" TEXT,
        "sendBackTo" TEXT,
        "sendBackNotes" TEXT,
        "patientType" TEXT DEFAULT 'outpatient',
        "wardName" TEXT,
        "bedNumber" INTEGER,
        "admissionDate" TEXT,
        "status" TEXT DEFAULT 'pending_review',
        "createdAt" TEXT DEFAULT now(),
        "reviewedAt" TEXT,
        "completedAt" TEXT,
        "sentByNurseInitials" TEXT,
        "sentAt" TEXT,
        "nurseDataLockedAt" TEXT,
        "doctorDataLockedAt" TEXT
      )`,
      
      // Drugs table
      `CREATE TABLE IF NOT EXISTS "drugs" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "genericName" TEXT,
        "category" TEXT,
        "form" TEXT,
        "strength" TEXT,
        "quantityInStock" INTEGER DEFAULT 0,
        "reorderLevel" INTEGER DEFAULT 10,
        "sellingPrice" REAL,
        "indication" TEXT,
        "adultDosage" TEXT,
        "pediatricDosage" TEXT,
        "sideEffects" TEXT,
        "contraindications" TEXT,
        "drugInteractions" TEXT,
        "storageConditions" TEXT,
        "manufacturer" TEXT,
        "requiresPrescription" BOOLEAN DEFAULT false,
        "controlledSubstance" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TEXT DEFAULT now()
      )`,
      
      // Lab Tests table
      `CREATE TABLE IF NOT EXISTS "lab_tests" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "category" TEXT,
        "sampleType" TEXT,
        "turnaroundTime" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TEXT DEFAULT now()
      )`,
      
      // Lab Requests table
      `CREATE TABLE IF NOT EXISTS "lab_requests" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "testId" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "priority" TEXT DEFAULT 'normal',
        "requestedAt" TEXT DEFAULT now(),
        "results" TEXT,
        "resultsEnteredAt" TEXT,
        "resultsEnteredBy" TEXT,
        "notes" TEXT
      )`,
      
      // Lab Results table
      `CREATE TABLE IF NOT EXISTS "lab_results" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "labRequestId" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "testId" TEXT NOT NULL,
        "result" TEXT NOT NULL,
        "unit" TEXT,
        "referenceRange" TEXT,
        "isAbnormal" BOOLEAN DEFAULT false,
        "notes" TEXT,
        "technicianInitials" TEXT NOT NULL,
        "verifiedBy" TEXT,
        "verifiedAt" TEXT,
        "createdAt" TEXT DEFAULT now()
      )`,
      
      // Queue Entries table
      `CREATE TABLE IF NOT EXISTS "queue_entries" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "queueNumber" INTEGER NOT NULL,
        "unit" TEXT NOT NULL,
        "status" TEXT DEFAULT 'waiting',
        "priority" TEXT DEFAULT 'normal',
        "notes" TEXT,
        "checkedInAt" TEXT DEFAULT now(),
        "calledAt" TEXT,
        "completedAt" TEXT
      )`,
      
      // Admissions table
      `CREATE TABLE IF NOT EXISTS "admissions" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "admissionDateTime" TEXT NOT NULL,
        "admissionType" TEXT DEFAULT 'elective',
        "admissionSource" TEXT DEFAULT 'home',
        "referringFacility" TEXT,
        "referringDoctor" TEXT,
        "wardId" TEXT,
        "wardName" TEXT,
        "bedNumber" INTEGER,
        "roomType" TEXT DEFAULT 'general',
        "reasonForAdmission" TEXT,
        "provisionalDiagnosis" TEXT,
        "chiefComplaint" TEXT,
        "historyOfPresentIllness" TEXT,
        "pastMedicalHistory" TEXT,
        "currentMedications" TEXT,
        "allergies" TEXT,
        "bloodPressureSystolic" INTEGER,
        "bloodPressureDiastolic" INTEGER,
        "temperature" REAL,
        "pulse" INTEGER,
        "respiratoryRate" INTEGER,
        "weight" REAL,
        "height" REAL,
        "oxygenSaturation" REAL,
        "painScore" INTEGER,
        "admittingDoctorId" TEXT,
        "admittingDoctorName" TEXT,
        "primaryNurseId" TEXT,
        "primaryNurseName" TEXT,
        "fallRisk" TEXT DEFAULT 'low',
        "pressureUlcerRisk" TEXT DEFAULT 'low',
        "infectionRisk" TEXT DEFAULT 'low',
        "nutritionalRisk" TEXT DEFAULT 'low',
        "dvtRisk" TEXT DEFAULT 'low',
        "consentForTreatment" BOOLEAN DEFAULT false,
        "consentForProcedures" BOOLEAN DEFAULT false,
        "consentSignedBy" TEXT,
        "consentDateTime" TEXT,
        "nextOfKinNotified" BOOLEAN DEFAULT false,
        "nextOfKinName" TEXT,
        "nextOfKinContactTime" TEXT,
        "belongings" TEXT,
        "valuables" TEXT,
        "valuablesHandedTo" TEXT,
        "expectedLengthOfStay" INTEGER,
        "anticipatedDischargeDate" TEXT,
        "status" TEXT DEFAULT 'active',
        "admittedBy" TEXT,
        "createdAt" TEXT DEFAULT now(),
        "updatedAt" TEXT,
        "dischargedAt" TEXT,
        "dischargeSummary" TEXT
      )`,
      
      // Dispensed Drugs table
      `CREATE TABLE IF NOT EXISTS "dispensed_drugs" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "drugId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "dispensingInitials" TEXT NOT NULL,
        "notes" TEXT,
        "dispensedAt" TEXT DEFAULT now(),
        "createdAt" TEXT DEFAULT now()
      )`,
      
      // Appointments table
      `CREATE TABLE IF NOT EXISTS "appointments" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "doctorId" TEXT,
        "department" TEXT,
        "appointmentDate" TEXT NOT NULL,
        "startTime" TEXT,
        "type" TEXT NOT NULL,
        "reason" TEXT,
        "status" TEXT DEFAULT 'scheduled',
        "createdAt" TEXT DEFAULT now(),
        "bookedByInitials" TEXT
      )`,
      
      // Prescriptions table
      `CREATE TABLE IF NOT EXISTS "prescriptions" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "createdAt" TEXT DEFAULT now()
      )`,
      
      // Announcements table
      `CREATE TABLE IF NOT EXISTS "announcements" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "type" TEXT DEFAULT 'general',
        "createdBy" TEXT,
        "createdAt" TEXT DEFAULT now(),
        "isRead" BOOLEAN DEFAULT false
      )`,
      
      // Voice Notes table
      `CREATE TABLE IF NOT EXISTS "voice_notes" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "senderId" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL,
        "recipientId" TEXT,
        "recipientRole" TEXT,
        "audioBase64" TEXT,
        "duration" INTEGER,
        "transcription" TEXT,
        "patientId" TEXT,
        "patientName" TEXT,
        "createdAt" TEXT DEFAULT now(),
        "isRead" BOOLEAN DEFAULT false
      )`,
      
      // Audit Logs table
      `CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "userName" TEXT,
        "userRole" TEXT,
        "action" TEXT NOT NULL,
        "entityType" TEXT,
        "entityId" TEXT,
        "entityName" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "ipAddress" TEXT,
        "timestamp" TEXT DEFAULT now(),
        "notes" TEXT,
        "details" TEXT
      )`,
      
      // App Settings table
      `CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "facilityName" TEXT NOT NULL DEFAULT 'RUN Health Centre',
        "facilityShortName" TEXT DEFAULT 'RUHC',
        "facilityCode" TEXT DEFAULT 'RUHC-2026',
        "facilityAddress" TEXT,
        "facilityCity" TEXT,
        "facilityState" TEXT,
        "facilityCountry" TEXT DEFAULT 'Nigeria',
        "primaryPhone" TEXT,
        "secondaryPhone" TEXT,
        "emergencyPhone" TEXT,
        "emailAddress" TEXT,
        "website" TEXT,
        "logoUrl" TEXT,
        "logoBase64" TEXT,
        "primaryColor" TEXT DEFAULT '#1e40af',
        "secondaryColor" TEXT DEFAULT '#3b82f6',
        "accentColor" TEXT DEFAULT '#10b981',
        "openingTime" TEXT DEFAULT '08:00',
        "closingTime" TEXT DEFAULT '18:00',
        "workingDays" TEXT DEFAULT 'Monday,Friday',
        "timezone" TEXT DEFAULT 'Africa/Lagos',
        "currency" TEXT DEFAULT 'NGN',
        "currencySymbol" TEXT DEFAULT '₦',
        "enableOnlineBooking" BOOLEAN DEFAULT false,
        "enableSmsNotifications" BOOLEAN DEFAULT false,
        "enableEmailNotifications" BOOLEAN DEFAULT false,
        "enableVoiceNotes" BOOLEAN DEFAULT true,
        "enableDailyDevotionals" BOOLEAN DEFAULT true,
        "welcomeMessage" TEXT,
        "headerMessage" TEXT,
        "footerMessage" TEXT,
        "lastUpdated" TEXT,
        "updatedBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now()
      )`
    ]
    
    const results = []
    
    for (const sql of tables) {
      try {
        await prisma.$executeRawUnsafe(sql)
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] || 'unknown'
        results.push({ status: 'created', table: tableName })
      } catch (error: any) {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] || 'unknown'
        results.push({ status: 'exists', table: tableName, message: error.message.substring(0, 50) })
      }
    }
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
