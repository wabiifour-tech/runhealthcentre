import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// User Management
export const users = defineTable({
  email: v.string(),
  name: v.string(),
  password: v.string(),
  role: v.string(),
  department: v.optional(v.string()),
  phone: v.optional(v.string()),
  initials: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  isActive: v.boolean(),
  isFirstLogin: v.boolean(),
  approvalStatus: v.optional(v.string()), // PENDING, APPROVED, REJECTED
  lastLogin: v.optional(v.string()),
  createdAt: v.string(),
})
  .index("by_email", ["email"])
  .index("by_approval_status", ["approvalStatus"]);

// Patients
export const patients = defineTable({
  patientId: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  dateOfBirth: v.string(),
  gender: v.string(),
  bloodGroup: v.optional(v.string()),
  genotype: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.optional(v.string()),
  emergencyContact: v.optional(v.string()),
  emergencyPhone: v.optional(v.string()),
  occupation: v.optional(v.string()),
  maritalStatus: v.optional(v.string()),
  religion: v.optional(v.string()),
  nationality: v.optional(v.string()),
  stateOfOrigin: v.optional(v.string()),
  lga: v.optional(v.string()),
  registeredById: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_patient_id", ["patientId"]);

// Appointments
export const appointments = defineTable({
  patientId: v.string(),
  doctorId: v.optional(v.string()),
  date: v.string(),
  time: v.string(),
  type: v.string(),
  status: v.string(),
  reason: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
});

// Consultations
export const consultations = defineTable({
  patientId: v.string(),
  doctorId: v.string(),
  appointmentId: v.optional(v.string()),
  chiefComplaint: v.optional(v.string()),
  presentIllness: v.optional(v.string()),
  pastHistory: v.optional(v.string()),
  examination: v.optional(v.string()),
  diagnosis: v.optional(v.string()),
  investigation: v.optional(v.string()),
  treatment: v.optional(v.string()),
  followUpNotes: v.optional(v.string()),
  status: v.string(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
});

// Vital Signs
export const vitalSigns = defineTable({
  patientId: v.string(),
  recordedById: v.string(),
  temperature: v.optional(v.number()),
  bloodPressure: v.optional(v.string()),
  heartRate: v.optional(v.number()),
  respiratoryRate: v.optional(v.number()),
  weight: v.optional(v.number()),
  height: v.optional(v.number()),
  bmi: v.optional(v.number()),
  oxygenSaturation: v.optional(v.number()),
  notes: v.optional(v.string()),
  createdAt: v.string(),
});

// Lab Tests
export const labTests = defineTable({
  name: v.string(),
  code: v.string(),
  category: v.string(),
  price: v.number(),
  normalRange: v.optional(v.string()),
  unit: v.optional(v.string()),
  turnaroundTime: v.optional(v.string()),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_code", ["code"]);

// Lab Requests
export const labRequests = defineTable({
  requestId: v.string(),
  patientId: v.string(),
  requestedById: v.string(),
  labTestId: v.string(),
  status: v.string(),
  priority: v.string(),
  clinicalNotes: v.optional(v.string()),
  result: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_request_id", ["requestId"]);

// Lab Results
export const labResults = defineTable({
  labRequestId: v.string(),
  result: v.string(),
  notes: v.optional(v.string()),
  createdAt: v.string(),
});

// Drugs
export const drugs = defineTable({
  name: v.string(),
  genericName: v.optional(v.string()),
  brand: v.optional(v.string()),
  category: v.string(),
  dosageForm: v.string(),
  strength: v.optional(v.string()),
  unitPrice: v.number(),
  stockQuantity: v.number(),
  reorderLevel: v.number(),
  expiryDate: v.optional(v.string()),
  supplier: v.optional(v.string()),
  location: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
});

// Prescriptions
export const prescriptions = defineTable({
  prescriptionId: v.string(),
  patientId: v.string(),
  prescribedById: v.string(),
  diagnosis: v.optional(v.string()),
  status: v.string(),
  notes: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_prescription_id", ["prescriptionId"]);

// Payments
export const payments = defineTable({
  paymentId: v.string(),
  patientId: v.optional(v.string()),
  amount: v.number(),
  method: v.string(),
  reference: v.optional(v.string()),
  status: v.string(),
  notes: v.optional(v.string()),
  createdAt: v.string(),
})
  .index("by_payment_id", ["paymentId"]);

// Admissions
export const admissions = defineTable({
  admissionId: v.string(),
  patientId: v.string(),
  ward: v.optional(v.string()),
  bed: v.optional(v.string()),
  admittingDoctorId: v.optional(v.string()),
  admissionDate: v.string(),
  dischargeDate: v.optional(v.string()),
  reason: v.string(),
  diagnosis: v.optional(v.string()),
  notes: v.optional(v.string()),
  status: v.string(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_admission_id", ["admissionId"]);

// Patient Wallet
export const patientWallets = defineTable({
  patientId: v.string(),
  balance: v.number(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
})
  .index("by_patient_id", ["patientId"]);

// Wallet Transactions
export const walletTransactions = defineTable({
  walletId: v.string(),
  amount: v.number(),
  type: v.string(),
  reference: v.optional(v.string()),
  description: v.optional(v.string()),
  createdAt: v.string(),
});

// Announcements
export const announcements = defineTable({
  title: v.string(),
  content: v.string(),
  priority: v.string(),
  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
});

// Audit Logs
export const auditLogs = defineTable({
  userId: v.optional(v.string()),
  action: v.string(),
  entity: v.string(),
  entityId: v.optional(v.string()),
  details: v.optional(v.string()),
  ipAddress: v.optional(v.string()),
  createdAt: v.string(),
});

// App Settings
export const appSettings = defineTable({
  // Facility Information
  facilityName: v.string(),
  facilityShortName: v.optional(v.string()),
  facilityCode: v.optional(v.string()),
  facilityAddress: v.optional(v.string()),
  facilityCity: v.optional(v.string()),
  facilityState: v.optional(v.string()),
  facilityCountry: v.optional(v.string()),
  // Contact Information
  primaryPhone: v.optional(v.string()),
  secondaryPhone: v.optional(v.string()),
  emergencyPhone: v.optional(v.string()),
  emailAddress: v.optional(v.string()),
  website: v.optional(v.string()),
  // Branding
  logoUrl: v.optional(v.string()),
  logoBase64: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  secondaryColor: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  // Operational Settings
  openingTime: v.optional(v.string()),
  closingTime: v.optional(v.string()),
  workingDays: v.optional(v.string()),
  timezone: v.optional(v.string()),
  currency: v.optional(v.string()),
  currencySymbol: v.optional(v.string()),
  // Feature Flags
  enableOnlineBooking: v.boolean(),
  enableSmsNotifications: v.boolean(),
  enableEmailNotifications: v.boolean(),
  enableVoiceNotes: v.boolean(),
  enableDailyDevotionals: v.boolean(),
  // Custom Messages
  welcomeMessage: v.optional(v.string()),
  headerMessage: v.optional(v.string()),
  footerMessage: v.optional(v.string()),
  // System
  lastUpdated: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
});

// Queue Entries
export const queueEntries = defineTable({
  patientId: v.string(),
  queueNumber: v.number(),
  department: v.string(),
  status: v.string(),
  priority: v.string(),
  createdAt: v.string(),
});

// Open Heavens Devotionals
export const openHeavensDevotionals = defineTable({
  date: v.string(),
  title: v.string(),
  verse: v.string(),
  content: v.string(),
  prayer: v.optional(v.string()),
  createdAt: v.string(),
})
  .index("by_date", ["date"]);

export default defineSchema({
  users,
  patients,
  appointments,
  consultations,
  vitalSigns,
  labTests,
  labRequests,
  labResults,
  drugs,
  prescriptions,
  payments,
  admissions,
  patientWallets,
  walletTransactions,
  announcements,
  auditLogs,
  appSettings,
  queueEntries,
  openHeavensDevotionals,
});
