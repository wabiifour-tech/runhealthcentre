-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "password" TEXT NOT NULL,
    "viewablePassword" TEXT,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "initials" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATETIME,
    "profilePhoto" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rememberToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "lastLogin" DATETIME,
    "passwordResetAt" DATETIME,
    "passwordResetBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hospitalNumber" TEXT,
    "ruhcCode" TEXT NOT NULL,
    "matricNumber" TEXT,
    "patientType" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "title" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "bloodGroup" TEXT,
    "genotype" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "lga" TEXT,
    "nationality" TEXT,
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
    "currentUnit" TEXT,
    "bedNumber" INTEGER,
    "admissionDate" DATETIME,
    "dischargeDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredBy" TEXT,
    "lastEditedBy" TEXT,
    "lastEditedAt" DATETIME
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "type" TEXT,
    "reason" TEXT,
    "appointmentDate" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "initials" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "pastMedicalHistory" TEXT,
    "signsAndSymptoms" TEXT,
    "bloodPressureSystolic" TEXT,
    "bloodPressureDiastolic" TEXT,
    "temperature" TEXT,
    "pulse" TEXT,
    "respiratoryRate" TEXT,
    "weight" TEXT,
    "height" TEXT,
    "oxygenSaturation" TEXT,
    "generalExamination" TEXT,
    "systemExamination" TEXT,
    "investigationsRequested" TEXT,
    "scanRequested" TEXT,
    "scanFindings" TEXT,
    "provisionalDiagnosis" TEXT,
    "finalDiagnosis" TEXT,
    "treatmentPlan" TEXT,
    "prescriptions" TEXT,
    "referredTo" TEXT,
    "referralTo" TEXT,
    "referralNotes" TEXT,
    "sendBackTo" TEXT,
    "sendBackNotes" TEXT,
    "sentByNurseInitials" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "recordedBy" TEXT,
    "bloodPressureSystolic" TEXT,
    "bloodPressureDiastolic" TEXT,
    "temperature" TEXT,
    "pulse" TEXT,
    "respiratoryRate" TEXT,
    "weight" TEXT,
    "height" TEXT,
    "oxygenSaturation" TEXT,
    "painScore" TEXT,
    "notes" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vital_signs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vital_signs_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "prescribedBy" TEXT,
    "medications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensedAt" DATETIME,
    CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prescriptions_prescribedBy_fkey" FOREIGN KEY ("prescribedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "tests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "lab_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "patientId" TEXT NOT NULL,
    "testName" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_results_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_results_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" DATETIME,
    CONSTRAINT "queue_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "unit" TEXT,
    "bedNumber" INTEGER,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'admitted',
    "admittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "admissions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "dosageForm" TEXT,
    "strength" TEXT,
    "unit" TEXT,
    "price" REAL,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" REAL,
    "turnaroundTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "recipientRole" TEXT,
    "transcription" TEXT,
    "audioUrl" TEXT,
    "initials" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT,
    "diagnosis" TEXT,
    "daysOff" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "notes" TEXT,
    "issuedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medical_certificates_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "medical_certificates_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referral_letters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "referredTo" TEXT,
    "reason" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "issuedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_letters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referral_letters_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "discharge_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "admissionDate" TEXT,
    "dischargeDate" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" TEXT,
    "followUp" TEXT,
    "notes" TEXT,
    "dischargedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discharge_summaries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discharge_summaries_dischargedBy_fkey" FOREIGN KEY ("dischargedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rosters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT,
    "staffName" TEXT,
    "staffRole" TEXT,
    "subDepartment" TEXT,
    "date" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rosters_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT,
    "staffName" TEXT,
    "staffRole" TEXT,
    "subDepartment" TEXT,
    "date" TEXT NOT NULL,
    "signInTime" TEXT,
    "signInPhoto" TEXT,
    "signOutTime" TEXT,
    "signOutPhoto" TEXT,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "deviceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityName" TEXT NOT NULL DEFAULT 'Redeemer''s University Health Centre (RUHC)',
    "facilityShortName" TEXT NOT NULL DEFAULT 'RUHC',
    "facilityCode" TEXT NOT NULL DEFAULT 'RUHC-2026',
    "facilityAddress" TEXT,
    "facilityCity" TEXT,
    "facilityState" TEXT,
    "facilityCountry" TEXT NOT NULL DEFAULT 'Nigeria',
    "primaryPhone" TEXT,
    "secondaryPhone" TEXT,
    "emergencyPhone" TEXT,
    "emailAddress" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "logoBase64" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1e40af',
    "secondaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "accentColor" TEXT NOT NULL DEFAULT '#10b981',
    "openingTime" TEXT NOT NULL DEFAULT '08:00',
    "closingTime" TEXT NOT NULL DEFAULT '18:00',
    "workingDays" TEXT NOT NULL DEFAULT 'Monday,Friday',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "currencySymbol" TEXT NOT NULL DEFAULT '₦',
    "enableOnlineBooking" BOOLEAN NOT NULL DEFAULT false,
    "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "enableVoiceNotes" BOOLEAN NOT NULL DEFAULT true,
    "enableDailyDevotionals" BOOLEAN NOT NULL DEFAULT true,
    "enableDrugInteractionCheck" BOOLEAN NOT NULL DEFAULT true,
    "enableVitalAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enableAuditLogging" BOOLEAN NOT NULL DEFAULT true,
    "enableBreakGlass" BOOLEAN NOT NULL DEFAULT true,
    "enableTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "welcomeMessage" TEXT,
    "headerMessage" TEXT,
    "footerMessage" TEXT,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireSpecial" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiryDays" INTEGER NOT NULL DEFAULT 90,
    "auditLogRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "logPatientAccess" BOOLEAN NOT NULL DEFAULT true,
    "logDataModifications" BOOLEAN NOT NULL DEFAULT true,
    "logLoginAttempts" BOOLEAN NOT NULL DEFAULT true,
    "smsProvider" TEXT,
    "smsApiKey" TEXT,
    "smsApiSecret" TEXT,
    "smsSenderId" TEXT,
    "emailProvider" TEXT,
    "emailApiKey" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "rolePermissions" TEXT,
    "queuePrefix" TEXT NOT NULL DEFAULT 'RUHC',
    "queueStartNumber" INTEGER NOT NULL DEFAULT 1,
    "queueResetDaily" BOOLEAN NOT NULL DEFAULT true,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupFrequency" TEXT,
    "backupRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "lastBackupAt" DATETIME,
    "lastUpdated" DATETIME,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "routing_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "sender_initials" TEXT,
    "receiver_id" TEXT,
    "receiver_name" TEXT,
    "receiver_role" TEXT,
    "receiver_department" TEXT,
    "patient_id" TEXT,
    "patient_name" TEXT,
    "patient_hospital_number" TEXT,
    "request_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "subject" TEXT NOT NULL,
    "message" TEXT,
    "notes" TEXT,
    "consultation_id" TEXT,
    "lab_request_id" TEXT,
    "prescription_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acknowledged_at" DATETIME,
    "acknowledged_by" TEXT,
    "completed_at" DATETIME,
    "completed_by" TEXT,
    "completion_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "enrolleeId" TEXT,
    "hmoId" TEXT,
    "claimType" TEXT,
    "services" TEXT,
    "totalAmount" REAL,
    "approvedAmount" REAL,
    "diagnosis" TEXT,
    "icdCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" DATETIME,
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "insurance_claims_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surgery_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "preOpChecklist" TEXT,
    "notes" TEXT,
    "bookedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "surgery_bookings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "immunization_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "vaccineName" TEXT,
    "doseNumber" INTEGER,
    "batchNumber" TEXT,
    "administeredBy" TEXT,
    "administeredAt" DATETIME,
    "nextDoseDate" DATETIME,
    "reactions" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "immunization_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blood_donors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bloodGroup" TEXT,
    "genotype" TEXT,
    "lastDonationDate" DATETIME,
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blood_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT,
    "donorName" TEXT,
    "bloodGroup" TEXT,
    "componentType" TEXT,
    "volumeMl" INTEGER,
    "collectionDate" DATETIME,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'available',
    "reservedForPatientId" TEXT,
    "transfusedAt" DATETIME,
    "transfusedToPatientId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "medication_administrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "drugName" TEXT,
    "dosage" TEXT,
    "route" TEXT,
    "administeredBy" TEXT,
    "administeredAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medication_administrations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "taskId" TEXT,
    "taskName" TEXT,
    "scheduledTime" DATETIME,
    "duration" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "assignedBy" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "completedBy" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceInterval" INTEGER,
    "nextOccurrence" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_tasks_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "targetRoles" TEXT,
    "type" TEXT,
    "title" TEXT,
    "message" TEXT,
    "data" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "lastTransactionAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_wallets_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT,
    "type" TEXT,
    "amount" REAL,
    "description" TEXT,
    "reference" TEXT,
    "balanceAfter" REAL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "floor" TEXT,
    "totalBeds" INTEGER NOT NULL DEFAULT 0,
    "availableBeds" INTEGER NOT NULL DEFAULT 0,
    "occupiedBeds" INTEGER NOT NULL DEFAULT 0,
    "nurseInCharge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wardId" TEXT NOT NULL,
    "wardName" TEXT,
    "bedNumber" INTEGER NOT NULL,
    "roomNumber" TEXT,
    "roomType" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'available',
    "patientId" TEXT,
    "patientName" TEXT,
    "admittedAt" DATETIME,
    "expectedDischarge" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "staff_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientRole" TEXT,
    "message" TEXT NOT NULL,
    "subject" TEXT,
    "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "video_consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "doctorId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "doctorInitials" TEXT,
    "consultationId" TEXT,
    "chiefComplaint" TEXT,
    "scheduledDateTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "roomCode" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "duration" INTEGER,
    "participantIds" TEXT,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "notes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    CONSTRAINT "video_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "patientId" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "items" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT,
    "patientId" TEXT,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "collectedBy" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidTo" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "reference" TEXT,
    "authorizedBy" TEXT NOT NULL,
    "authorizedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "attachments" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "unit" TEXT NOT NULL,
    "unitPrice" REAL,
    "supplier" TEXT,
    "supplierContact" TEXT,
    "location" TEXT,
    "lastRestocked" DATETIME,
    "expiryDate" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetTag" TEXT,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "location" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'working',
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDate" DATETIME,
    "warrantyExpiry" DATETIME,
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "medical_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "location" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_use',
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDate" DATETIME,
    "warrantyExpiry" DATETIME,
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "shift_swaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterShiftId" TEXT,
    "requesterShiftDate" TEXT,
    "requesterShiftType" TEXT,
    "requestedStaffId" TEXT NOT NULL,
    "requestedStaffName" TEXT NOT NULL,
    "requestedShiftId" TEXT,
    "requestedShiftDate" TEXT,
    "requestedShiftType" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "certificationName" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "dateObtained" DATETIME NOT NULL,
    "expiryDate" DATETIME,
    "certificateNumber" TEXT,
    "documentUrl" TEXT,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "isExpiringSoon" BOOLEAN NOT NULL DEFAULT false,
    "cpdPoints" INTEGER,
    "notes" TEXT,
    "reminderSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "trainingName" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT,
    "cpdPointsEarned" INTEGER,
    "score" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "staff_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "staffRole" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "clockIn" DATETIME,
    "clockOut" DATETIME,
    "clockInMethod" TEXT NOT NULL DEFAULT 'manual',
    "clockOutMethod" TEXT,
    "workHours" REAL,
    "overtimeHours" REAL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "location" TEXT,
    "notes" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "antenatal_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "gestationalAge" INTEGER NOT NULL,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "weight" REAL,
    "fundalHeight" REAL,
    "fetalHeartRate" INTEGER,
    "fetalMovement" TEXT,
    "presentation" TEXT,
    "urineProtein" TEXT,
    "hemoglobinLevel" REAL,
    "riskFactors" TEXT,
    "notes" TEXT,
    "seenBy" TEXT NOT NULL,
    "nextAppointmentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "antenatal_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ambulance_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'dispatched',
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleNumber" TEXT,
    "dispatchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enRouteAt" DATETIME,
    "arrivedAt" DATETIME,
    "completedAt" DATETIME,
    "distance" REAL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dispensed_drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "drugId" TEXT,
    "drugName" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL,
    "totalPrice" REAL,
    "dispensingInitials" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "consultationId" TEXT,
    "dispensedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispensed_drugs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_qr_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "qrImage" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" DATETIME,
    "printedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_qr_codes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "patients_hospitalNumber_key" ON "patients"("hospitalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_ruhcCode_key" ON "patients"("ruhcCode");

-- CreateIndex
CREATE UNIQUE INDEX "patients_matricNumber_key" ON "patients"("matricNumber");

-- CreateIndex
CREATE INDEX "patients_ruhcCode_idx" ON "patients"("ruhcCode");

-- CreateIndex
CREATE INDEX "patients_hospitalNumber_idx" ON "patients"("hospitalNumber");

-- CreateIndex
CREATE INDEX "patients_matricNumber_idx" ON "patients"("matricNumber");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "patients"("isActive");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_doctorId_idx" ON "appointments"("doctorId");

-- CreateIndex
CREATE INDEX "appointments_appointmentDate_idx" ON "appointments"("appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "consultations_patientId_idx" ON "consultations"("patientId");

-- CreateIndex
CREATE INDEX "consultations_doctorId_idx" ON "consultations"("doctorId");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- CreateIndex
CREATE INDEX "consultations_createdAt_idx" ON "consultations"("createdAt");

-- CreateIndex
CREATE INDEX "vital_signs_patientId_idx" ON "vital_signs"("patientId");

-- CreateIndex
CREATE INDEX "vital_signs_recordedAt_idx" ON "vital_signs"("recordedAt");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "prescriptions_createdAt_idx" ON "prescriptions"("createdAt");

-- CreateIndex
CREATE INDEX "lab_requests_patientId_idx" ON "lab_requests"("patientId");

-- CreateIndex
CREATE INDEX "lab_requests_status_idx" ON "lab_requests"("status");

-- CreateIndex
CREATE INDEX "lab_requests_requestedAt_idx" ON "lab_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "lab_results_patientId_idx" ON "lab_results"("patientId");

-- CreateIndex
CREATE INDEX "lab_results_requestId_idx" ON "lab_results"("requestId");

-- CreateIndex
CREATE INDEX "lab_results_createdAt_idx" ON "lab_results"("createdAt");

-- CreateIndex
CREATE INDEX "queue_entries_patientId_idx" ON "queue_entries"("patientId");

-- CreateIndex
CREATE INDEX "queue_entries_status_idx" ON "queue_entries"("status");

-- CreateIndex
CREATE INDEX "queue_entries_unit_idx" ON "queue_entries"("unit");

-- CreateIndex
CREATE INDEX "admissions_patientId_idx" ON "admissions"("patientId");

-- CreateIndex
CREATE INDEX "admissions_status_idx" ON "admissions"("status");

-- CreateIndex
CREATE INDEX "drugs_name_idx" ON "drugs"("name");

-- CreateIndex
CREATE INDEX "drugs_category_idx" ON "drugs"("category");

-- CreateIndex
CREATE INDEX "drugs_isActive_idx" ON "drugs"("isActive");

-- CreateIndex
CREATE INDEX "lab_tests_name_idx" ON "lab_tests"("name");

-- CreateIndex
CREATE INDEX "lab_tests_category_idx" ON "lab_tests"("category");

-- CreateIndex
CREATE INDEX "lab_tests_isActive_idx" ON "lab_tests"("isActive");

-- CreateIndex
CREATE INDEX "announcements_type_idx" ON "announcements"("type");

-- CreateIndex
CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");

-- CreateIndex
CREATE INDEX "voice_notes_patientId_idx" ON "voice_notes"("patientId");

-- CreateIndex
CREATE INDEX "voice_notes_createdAt_idx" ON "voice_notes"("createdAt");

-- CreateIndex
CREATE INDEX "medical_certificates_patientId_idx" ON "medical_certificates"("patientId");

-- CreateIndex
CREATE INDEX "medical_certificates_createdAt_idx" ON "medical_certificates"("createdAt");

-- CreateIndex
CREATE INDEX "referral_letters_patientId_idx" ON "referral_letters"("patientId");

-- CreateIndex
CREATE INDEX "referral_letters_createdAt_idx" ON "referral_letters"("createdAt");

-- CreateIndex
CREATE INDEX "discharge_summaries_patientId_idx" ON "discharge_summaries"("patientId");

-- CreateIndex
CREATE INDEX "discharge_summaries_createdAt_idx" ON "discharge_summaries"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "rosters_staffId_idx" ON "rosters"("staffId");

-- CreateIndex
CREATE INDEX "rosters_date_idx" ON "rosters"("date");

-- CreateIndex
CREATE INDEX "rosters_shift_idx" ON "rosters"("shift");

-- CreateIndex
CREATE INDEX "attendance_staffId_idx" ON "attendance"("staffId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "routing_requests_receiver_id_idx" ON "routing_requests"("receiver_id");

-- CreateIndex
CREATE INDEX "routing_requests_receiver_role_idx" ON "routing_requests"("receiver_role");

-- CreateIndex
CREATE INDEX "routing_requests_sender_id_idx" ON "routing_requests"("sender_id");

-- CreateIndex
CREATE INDEX "routing_requests_status_idx" ON "routing_requests"("status");

-- CreateIndex
CREATE INDEX "insurance_claims_patientId_idx" ON "insurance_claims"("patientId");

-- CreateIndex
CREATE INDEX "insurance_claims_status_idx" ON "insurance_claims"("status");

-- CreateIndex
CREATE INDEX "surgery_bookings_patientId_idx" ON "surgery_bookings"("patientId");

-- CreateIndex
CREATE INDEX "surgery_bookings_status_idx" ON "surgery_bookings"("status");

-- CreateIndex
CREATE INDEX "surgery_bookings_scheduledDate_idx" ON "surgery_bookings"("scheduledDate");

-- CreateIndex
CREATE INDEX "immunization_records_patientId_idx" ON "immunization_records"("patientId");

-- CreateIndex
CREATE INDEX "immunization_records_vaccineName_idx" ON "immunization_records"("vaccineName");

-- CreateIndex
CREATE INDEX "blood_donors_bloodGroup_idx" ON "blood_donors"("bloodGroup");

-- CreateIndex
CREATE INDEX "blood_donors_isEligible_idx" ON "blood_donors"("isEligible");

-- CreateIndex
CREATE INDEX "blood_units_bloodGroup_idx" ON "blood_units"("bloodGroup");

-- CreateIndex
CREATE INDEX "blood_units_status_idx" ON "blood_units"("status");

-- CreateIndex
CREATE INDEX "blood_units_expiryDate_idx" ON "blood_units"("expiryDate");

-- CreateIndex
CREATE INDEX "medication_administrations_patientId_idx" ON "medication_administrations"("patientId");

-- CreateIndex
CREATE INDEX "medication_administrations_administeredAt_idx" ON "medication_administrations"("administeredAt");

-- CreateIndex
CREATE INDEX "patient_tasks_patientId_idx" ON "patient_tasks"("patientId");

-- CreateIndex
CREATE INDEX "patient_tasks_status_idx" ON "patient_tasks"("status");

-- CreateIndex
CREATE INDEX "patient_tasks_scheduledTime_idx" ON "patient_tasks"("scheduledTime");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_wallets_patientId_key" ON "patient_wallets"("patientId");

-- CreateIndex
CREATE INDEX "patient_wallets_patientId_idx" ON "patient_wallets"("patientId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "wards_type_idx" ON "wards"("type");

-- CreateIndex
CREATE INDEX "wards_status_idx" ON "wards"("status");

-- CreateIndex
CREATE INDEX "beds_wardId_idx" ON "beds"("wardId");

-- CreateIndex
CREATE INDEX "beds_status_idx" ON "beds"("status");

-- CreateIndex
CREATE INDEX "staff_messages_senderId_idx" ON "staff_messages"("senderId");

-- CreateIndex
CREATE INDEX "staff_messages_recipientId_idx" ON "staff_messages"("recipientId");

-- CreateIndex
CREATE INDEX "staff_messages_isRead_idx" ON "staff_messages"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_roomCode_key" ON "video_consultations"("roomCode");

-- CreateIndex
CREATE INDEX "video_consultations_patientId_idx" ON "video_consultations"("patientId");

-- CreateIndex
CREATE INDEX "video_consultations_doctorId_idx" ON "video_consultations"("doctorId");

-- CreateIndex
CREATE INDEX "video_consultations_status_idx" ON "video_consultations"("status");

-- CreateIndex
CREATE INDEX "video_consultations_scheduledDateTime_idx" ON "video_consultations"("scheduledDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "bills"("billNumber");

-- CreateIndex
CREATE INDEX "bills_patientId_idx" ON "bills"("patientId");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptNumber_key" ON "payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "payments_billId_idx" ON "payments"("billId");

-- CreateIndex
CREATE INDEX "payments_patientId_idx" ON "payments"("patientId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expenseNumber_key" ON "expenses"("expenseNumber");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_quantityInStock_idx" ON "inventory_items"("quantityInStock");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_assetTag_key" ON "equipment"("assetTag");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_department_idx" ON "equipment"("department");

-- CreateIndex
CREATE UNIQUE INDEX "medical_assets_assetTag_key" ON "medical_assets"("assetTag");

-- CreateIndex
CREATE INDEX "medical_assets_category_idx" ON "medical_assets"("category");

-- CreateIndex
CREATE INDEX "medical_assets_status_idx" ON "medical_assets"("status");

-- CreateIndex
CREATE INDEX "medical_assets_department_idx" ON "medical_assets"("department");

-- CreateIndex
CREATE INDEX "shift_swaps_requesterId_idx" ON "shift_swaps"("requesterId");

-- CreateIndex
CREATE INDEX "shift_swaps_requestedStaffId_idx" ON "shift_swaps"("requestedStaffId");

-- CreateIndex
CREATE INDEX "shift_swaps_status_idx" ON "shift_swaps"("status");

-- CreateIndex
CREATE INDEX "certifications_staffId_idx" ON "certifications"("staffId");

-- CreateIndex
CREATE INDEX "certifications_expiryDate_idx" ON "certifications"("expiryDate");

-- CreateIndex
CREATE INDEX "certifications_isExpired_idx" ON "certifications"("isExpired");

-- CreateIndex
CREATE INDEX "training_records_staffId_idx" ON "training_records"("staffId");

-- CreateIndex
CREATE INDEX "training_records_trainingType_idx" ON "training_records"("trainingType");

-- CreateIndex
CREATE INDEX "training_records_status_idx" ON "training_records"("status");

-- CreateIndex
CREATE INDEX "staff_attendances_staffId_idx" ON "staff_attendances"("staffId");

-- CreateIndex
CREATE INDEX "staff_attendances_date_idx" ON "staff_attendances"("date");

-- CreateIndex
CREATE INDEX "staff_attendances_status_idx" ON "staff_attendances"("status");

-- CreateIndex
CREATE INDEX "antenatal_visits_patientId_idx" ON "antenatal_visits"("patientId");

-- CreateIndex
CREATE INDEX "antenatal_visits_visitNumber_idx" ON "antenatal_visits"("visitNumber");

-- CreateIndex
CREATE INDEX "ambulance_calls_status_idx" ON "ambulance_calls"("status");

-- CreateIndex
CREATE INDEX "ambulance_calls_dispatchedAt_idx" ON "ambulance_calls"("dispatchedAt");

-- CreateIndex
CREATE INDEX "dispensed_drugs_patientId_idx" ON "dispensed_drugs"("patientId");

-- CreateIndex
CREATE INDEX "dispensed_drugs_drugId_idx" ON "dispensed_drugs"("drugId");

-- CreateIndex
CREATE INDEX "dispensed_drugs_dispensedAt_idx" ON "dispensed_drugs"("dispensedAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_qr_codes_patientId_key" ON "patient_qr_codes"("patientId");

-- CreateIndex
CREATE INDEX "patient_qr_codes_patientId_idx" ON "patient_qr_codes"("patientId");
