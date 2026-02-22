-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "initials" TEXT,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "passwordChangedAt" TEXT,
    "lastLogin" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hospitalNumber" TEXT NOT NULL,
    "ruhcCode" TEXT NOT NULL,
    "matricNumber" TEXT,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
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
    "nationality" TEXT NOT NULL DEFAULT 'Nigerian',
    "religion" TEXT,
    "occupation" TEXT,
    "maritalStatus" TEXT,
    "nokName" TEXT,
    "nokRelationship" TEXT,
    "nokPhone" TEXT,
    "nokAddress" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TEXT NOT NULL,
    "registeredBy" TEXT,
    "lastEditedAt" TEXT,
    "lastEditedBy" TEXT
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "nurseInitials" TEXT NOT NULL,
    "nurseId" TEXT,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "temperature" REAL,
    "pulse" INTEGER,
    "respiratoryRate" INTEGER,
    "weight" REAL,
    "height" REAL,
    "bmi" REAL,
    "oxygenSaturation" INTEGER,
    "painScore" INTEGER,
    "notes" TEXT,
    "pulseTimerSeconds" INTEGER,
    "respirationTimerSeconds" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TEXT,
    "recordedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "medication_administrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "nurseInitials" TEXT NOT NULL,
    "nurseId" TEXT,
    "notes" TEXT,
    "administeredAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "doctorName" TEXT,
    "doctorInitials" TEXT,
    "sentByNurseInitials" TEXT,
    "sentAt" TEXT,
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "pastMedicalHistory" TEXT,
    "signsAndSymptoms" TEXT,
    "nurseDataLockedAt" TEXT,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "temperature" REAL,
    "pulse" INTEGER,
    "respiratoryRate" INTEGER,
    "weight" REAL,
    "height" REAL,
    "oxygenSaturation" INTEGER,
    "generalExamination" TEXT,
    "systemExamination" TEXT,
    "investigationsRequested" TEXT,
    "scanRequested" TEXT,
    "scanFindings" TEXT,
    "provisionalDiagnosis" TEXT,
    "finalDiagnosis" TEXT,
    "hasPrescription" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionNotes" TEXT,
    "treatmentPlan" TEXT,
    "advice" TEXT,
    "followUpDate" TEXT,
    "referredTo" TEXT,
    "referralNotes" TEXT,
    "sendBackTo" TEXT,
    "sendBackNotes" TEXT,
    "patientType" TEXT,
    "wardName" TEXT,
    "bedNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "createdAt" TEXT NOT NULL,
    "reviewedAt" TEXT,
    "completedAt" TEXT,
    "doctorDataLockedAt" TEXT
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT,
    "form" TEXT,
    "strength" TEXT,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "sellingPrice" REAL NOT NULL,
    "costPrice" REAL,
    "indication" TEXT,
    "adultDosage" TEXT,
    "pediatricDosage" TEXT,
    "sideEffects" TEXT,
    "contraindications" TEXT,
    "drugInteractions" TEXT,
    "storageConditions" TEXT,
    "manufacturer" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "controlledSubstance" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "doctorId" TEXT,
    "doctorInitials" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT,
    "sampleType" TEXT,
    "turnaroundTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "lab_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "testId" TEXT,
    "testName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "requestedAt" TEXT NOT NULL,
    "results" TEXT,
    "resultsEnteredAt" TEXT,
    "resultsEnteredBy" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labRequestId" TEXT,
    "patientId" TEXT NOT NULL,
    "testId" TEXT,
    "testName" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "technicianInitials" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "checkedInAt" TEXT NOT NULL,
    "calledAt" TEXT,
    "completedAt" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "department" TEXT NOT NULL,
    "appointmentDate" TEXT NOT NULL,
    "startTime" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "bookedByInitials" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "admissionDateTime" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL DEFAULT 'elective',
    "admissionSource" TEXT NOT NULL DEFAULT 'home',
    "referringFacility" TEXT,
    "referringDoctor" TEXT,
    "wardId" TEXT NOT NULL,
    "wardName" TEXT NOT NULL,
    "bedNumber" INTEGER NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'general',
    "reasonForAdmission" TEXT NOT NULL,
    "provisionalDiagnosis" TEXT NOT NULL,
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
    "oxygenSaturation" INTEGER,
    "painScore" INTEGER,
    "admittingDoctorId" TEXT,
    "admittingDoctorName" TEXT,
    "primaryNurseId" TEXT,
    "primaryNurseName" TEXT,
    "fallRisk" TEXT NOT NULL DEFAULT 'low',
    "pressureUlcerRisk" TEXT NOT NULL DEFAULT 'low',
    "infectionRisk" TEXT NOT NULL DEFAULT 'low',
    "nutritionalRisk" TEXT NOT NULL DEFAULT 'low',
    "dvtRisk" TEXT NOT NULL DEFAULT 'low',
    "consentForTreatment" BOOLEAN NOT NULL DEFAULT false,
    "consentForProcedures" BOOLEAN NOT NULL DEFAULT false,
    "consentSignedBy" TEXT,
    "consentDateTime" TEXT,
    "nextOfKinNotified" BOOLEAN NOT NULL DEFAULT false,
    "nextOfKinName" TEXT,
    "nextOfKinContactTime" TEXT,
    "belongings" TEXT,
    "valuables" TEXT,
    "valuablesHandedTo" TEXT,
    "expectedLengthOfStay" INTEGER,
    "anticipatedDischargeDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "admittedBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT,
    "dischargedAt" TEXT,
    "dischargeSummary" TEXT
);

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "days" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "diagnosis" TEXT,
    "recommendations" TEXT,
    "doctorInitials" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "referral_letters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "referredTo" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatmentGiven" TEXT,
    "doctorInitials" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "discharge_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "admissionDate" TEXT NOT NULL,
    "dischargeDate" TEXT NOT NULL,
    "admissionDiagnosis" TEXT NOT NULL,
    "dischargeDiagnosis" TEXT NOT NULL,
    "treatmentSummary" TEXT NOT NULL,
    "medicationsOnDischarge" TEXT NOT NULL,
    "followUpInstructions" TEXT NOT NULL,
    "doctorInitials" TEXT NOT NULL,
    "nurseInitials" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "voice_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderInitials" TEXT,
    "recipientId" TEXT,
    "recipientRole" TEXT,
    "audioUrl" TEXT NOT NULL,
    "audioBase64" TEXT,
    "duration" INTEGER NOT NULL,
    "transcription" TEXT,
    "patientId" TEXT,
    "patientName" TEXT,
    "createdAt" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hospitalNumber_key" ON "patients"("hospitalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_ruhcCode_key" ON "patients"("ruhcCode");
