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
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "doctorId" TEXT,
    "doctorName" TEXT,
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
    "investigationsRequested" JSONB,
    "scanRequested" JSONB,
    "scanFindings" TEXT,
    "provisionalDiagnosis" TEXT,
    "finalDiagnosis" TEXT,
    "treatmentPlan" TEXT,
    "prescriptions" JSONB,
    "referredTo" TEXT,
    "referralTo" TEXT,
    "referralNotes" TEXT,
    "sendBackTo" JSONB,
    "sendBackNotes" TEXT,
    "sentByNurseInitials" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
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
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lab_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "requestedBy" TEXT,
    "tests" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "patientId" TEXT,
    "patient" JSONB,
    "testName" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "prescribedBy" TEXT,
    "medications" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensedAt" DATETIME
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" DATETIME
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "doctorId" TEXT,
    "doctorName" TEXT,
    "type" TEXT,
    "reason" TEXT,
    "appointmentDate" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "initials" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "unit" TEXT,
    "bedNumber" INTEGER,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'admitted',
    "admittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "voice_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "recipientRole" TEXT,
    "transcription" TEXT,
    "audioUrl" TEXT,
    "initials" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "type" TEXT,
    "diagnosis" TEXT,
    "daysOff" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "notes" TEXT,
    "issuedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "referral_letters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "referredTo" TEXT,
    "reason" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "issuedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "discharge_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "admissionDate" TEXT,
    "dischargeDate" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" TEXT,
    "followUp" TEXT,
    "notes" TEXT,
    "dischargedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "updatedAt" DATETIME NOT NULL
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
    "updatedAt" DATETIME NOT NULL
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
    "patientId" TEXT,
    "patient" JSONB,
    "enrolleeId" TEXT,
    "hmoId" TEXT,
    "claimType" TEXT,
    "services" JSONB,
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "surgery_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
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
    "preOpChecklist" JSONB,
    "notes" TEXT,
    "bookedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "immunization_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
    "vaccineName" TEXT,
    "doseNumber" INTEGER,
    "batchNumber" TEXT,
    "administeredBy" TEXT,
    "administeredAt" DATETIME,
    "nextDoseDate" DATETIME,
    "reactions" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "patientId" TEXT,
    "patient" JSONB,
    "drugName" TEXT,
    "dosage" TEXT,
    "route" TEXT,
    "administeredBy" TEXT,
    "administeredAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "patient_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "targetRoles" TEXT,
    "type" TEXT,
    "title" TEXT,
    "message" TEXT,
    "data" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "patient_wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "patient" JSONB,
    "balance" REAL NOT NULL DEFAULT 0,
    "lastTransactionAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "attachments" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "video_consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patient" JSONB,
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
    "participantIds" JSONB,
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
    "cancellationReason" TEXT
);

-- CreateTable
CREATE TABLE "video_consultation_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "joinedAt" DATETIME,
    "leftAt" DATETIME,
    "isVideoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isAudioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "connectionState" TEXT NOT NULL DEFAULT 'connecting',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "video_consultation_chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "patientId" TEXT,
    "patient" JSONB,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "items" JSONB,
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
    "patient" JSONB,
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
    "attachments" JSONB,
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
    "patient" JSONB,
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
    "riskFactors" JSONB,
    "notes" TEXT,
    "seenBy" TEXT NOT NULL,
    "nextAppointmentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "patient" JSONB,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "two_factor_setups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" DATETIME,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "backup_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "size" REAL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "patient_file_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "openedByName" TEXT NOT NULL,
    "openedByRole" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL DEFAULT 'viewed',
    "section" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "diagnosis_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "patient" JSONB,
    "diagnosis" TEXT NOT NULL,
    "icdCode" TEXT,
    "diagnosisType" TEXT NOT NULL DEFAULT 'provisional',
    "doctorInitials" TEXT NOT NULL,
    "doctorName" TEXT,
    "notes" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "electronic_prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "patient" JSONB,
    "doctorId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "doctorInitials" TEXT NOT NULL,
    "items" JSONB,
    "diagnosis" TEXT,
    "notes" TEXT,
    "drugInteractions" JSONB,
    "hasAllergyWarning" BOOLEAN NOT NULL DEFAULT false,
    "allergyDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dispensedAt" DATETIME,
    "dispensedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "queue_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "patient" JSONB,
    "ticketNumber" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" DATETIME,
    "completedAt" DATETIME,
    "estimatedWaitMinutes" INTEGER,
    "notifiedAt" DATETIME,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "open_heavens_devotionals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "memoryVerse" TEXT NOT NULL,
    "memoryVerseReference" TEXT NOT NULL,
    "bibleReading" TEXT NOT NULL,
    "bibleReadingReference" TEXT NOT NULL,
    "bibleInOneYear" TEXT,
    "message" TEXT NOT NULL,
    "prayerPoints" JSONB,
    "actionPoint" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Pastor E.A. Adeboye',
    "topic" TEXT,
    "source" TEXT,
    "link" TEXT,
    "hymn" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "daily_verses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "verse" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "translation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_ruhcCode_key" ON "patients"("ruhcCode");

-- CreateIndex
CREATE INDEX "routing_requests_receiver_id_idx" ON "routing_requests"("receiver_id");

-- CreateIndex
CREATE INDEX "routing_requests_receiver_role_idx" ON "routing_requests"("receiver_role");

-- CreateIndex
CREATE INDEX "routing_requests_sender_id_idx" ON "routing_requests"("sender_id");

-- CreateIndex
CREATE INDEX "routing_requests_status_idx" ON "routing_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "patient_wallets_patientId_key" ON "patient_wallets"("patientId");

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
CREATE INDEX "staff_messages_recipientRole_idx" ON "staff_messages"("recipientRole");

-- CreateIndex
CREATE INDEX "staff_messages_isRead_idx" ON "staff_messages"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_roomCode_key" ON "video_consultations"("roomCode");

-- CreateIndex
CREATE INDEX "video_consultations_doctorId_idx" ON "video_consultations"("doctorId");

-- CreateIndex
CREATE INDEX "video_consultations_patientId_idx" ON "video_consultations"("patientId");

-- CreateIndex
CREATE INDEX "video_consultations_status_idx" ON "video_consultations"("status");

-- CreateIndex
CREATE INDEX "video_consultations_scheduledDateTime_idx" ON "video_consultations"("scheduledDateTime");

-- CreateIndex
CREATE INDEX "video_consultation_participants_consultationId_idx" ON "video_consultation_participants"("consultationId");

-- CreateIndex
CREATE INDEX "video_consultation_participants_userId_idx" ON "video_consultation_participants"("userId");

-- CreateIndex
CREATE INDEX "video_consultation_chat_consultationId_idx" ON "video_consultation_chat"("consultationId");

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

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_setups_userId_key" ON "two_factor_setups"("userId");

-- CreateIndex
CREATE INDEX "two_factor_setups_userId_idx" ON "two_factor_setups"("userId");

-- CreateIndex
CREATE INDEX "backup_records_type_idx" ON "backup_records"("type");

-- CreateIndex
CREATE INDEX "backup_records_status_idx" ON "backup_records"("status");

-- CreateIndex
CREATE INDEX "patient_file_access_patientId_idx" ON "patient_file_access"("patientId");

-- CreateIndex
CREATE INDEX "patient_file_access_openedBy_idx" ON "patient_file_access"("openedBy");

-- CreateIndex
CREATE INDEX "patient_file_access_openedAt_idx" ON "patient_file_access"("openedAt");

-- CreateIndex
CREATE INDEX "diagnosis_records_consultationId_idx" ON "diagnosis_records"("consultationId");

-- CreateIndex
CREATE INDEX "diagnosis_records_patientId_idx" ON "diagnosis_records"("patientId");

-- CreateIndex
CREATE INDEX "diagnosis_records_icdCode_idx" ON "diagnosis_records"("icdCode");

-- CreateIndex
CREATE INDEX "electronic_prescriptions_patientId_idx" ON "electronic_prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "electronic_prescriptions_doctorId_idx" ON "electronic_prescriptions"("doctorId");

-- CreateIndex
CREATE INDEX "electronic_prescriptions_status_idx" ON "electronic_prescriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tickets_ticketNumber_key" ON "queue_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "queue_tickets_patientId_idx" ON "queue_tickets"("patientId");

-- CreateIndex
CREATE INDEX "queue_tickets_unit_idx" ON "queue_tickets"("unit");

-- CreateIndex
CREATE INDEX "queue_tickets_status_idx" ON "queue_tickets"("status");

-- CreateIndex
CREATE INDEX "queue_tickets_issuedAt_idx" ON "queue_tickets"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "open_heavens_devotionals_date_key" ON "open_heavens_devotionals"("date");

-- CreateIndex
CREATE INDEX "open_heavens_devotionals_date_idx" ON "open_heavens_devotionals"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_verses_date_key" ON "daily_verses"("date");

-- CreateIndex
CREATE INDEX "daily_verses_date_idx" ON "daily_verses"("date");
