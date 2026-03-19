/**
 * Validation Utilities using Zod
 * 
 * Provides schema validation for all API inputs
 */

import { z } from 'zod'

// Common validation schemas
export const idSchema = z.string().min(1, 'ID is required')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const dateSchema = z.string().datetime().or(z.date())

export const phoneSchema = z.string().min(10).max(15).regex(/^\+?[\d\s-]+$/, 'Invalid phone number format')

export const emailSchema = z.string().email('Invalid email address')

export const bloodGroupSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])

export const genotypeSchema = z.enum(['AA', 'AS', 'SS', 'AC', 'SC', 'Unknown'])

export const genderSchema = z.enum(['Male', 'Female', 'Other', 'Unknown'])

export const patientTypeSchema = z.enum(['Student', 'Academic Staff', 'Non-Academic Staff', 'Outsider', 'Dependant'])

// Patient validation schemas
export const patientCreateSchema = z.object({
  hospitalNumber: z.string().optional(),
  matricNumber: z.string().optional(),
  patientType: patientTypeSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  title: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: genderSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  genotype: genotypeSchema.optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  lga: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  religion: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'Unknown']).optional(),
  // Next of Kin
  nokName: z.string().max(200).optional(),
  nokRelationship: z.string().max(50).optional(),
  nokPhone: phoneSchema.optional().or(z.literal('')),
  nokAddress: z.string().max(500).optional(),
  // Emergency Contact
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: phoneSchema.optional().or(z.literal('')),
  emergencyContactRelationship: z.string().max(50).optional(),
  // Insurance
  insuranceNumber: z.string().max(100).optional(),
  insuranceProvider: z.string().max(100).optional(),
  // Medical Info
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  currentMedications: z.string().optional(),
  // Registration metadata
  registeredBy: z.string().optional()
})

export const patientUpdateSchema = patientCreateSchema.partial()

// Consultation validation schemas
export const consultationCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  signsAndSymptoms: z.string().optional(),
  // Vitals (can be pre-filled from triage)
  bloodPressureSystolic: z.string().optional(),
  bloodPressureDiastolic: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  respiratoryRate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  // Examination
  generalExamination: z.string().optional(),
  systemExamination: z.string().optional(),
  // Investigations
  investigationsRequested: z.array(z.string()).optional(),
  scanRequested: z.array(z.string()).optional(),
  scanFindings: z.string().optional(),
  // Diagnosis
  provisionalDiagnosis: z.string().optional(),
  finalDiagnosis: z.string().optional(),
  // Treatment
  treatmentPlan: z.string().optional(),
  prescriptions: z.array(z.object({
    drugId: z.string(),
    drugName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    notes: z.string().optional()
  })).optional(),
  // Referral
  referredTo: z.enum(['nurse', 'doctor', 'lab', 'pharmacy', 'matron', 'records']).optional(),
  referralTo: z.string().optional(),
  referralNotes: z.string().optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'sent_back', 'pending_review']).optional()
})

// Vital signs validation schema
export const vitalSignsCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  bloodPressureSystolic: z.string().optional(),
  bloodPressureDiastolic: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  respiratoryRate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  painScore: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().optional()
})

// Prescription validation schema
export const prescriptionCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  medications: z.array(z.object({
    drugId: z.string(),
    drugName: z.string().min(1, 'Drug name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    quantity: z.number().int().positive().optional(),
    instructions: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'At least one medication is required'),
  notes: z.string().optional()
})

// Lab request validation schema
export const labRequestCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  tests: z.array(z.object({
    testId: z.string(),
    testName: z.string(),
    notes: z.string().optional()
  })).min(1, 'At least one test is required'),
  notes: z.string().optional(),
  urgency: z.enum(['routine', 'urgent', 'stat']).optional().default('routine')
})

// Appointment validation schema
export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  type: z.enum(['consultation', 'follow_up', 'checkup', 'emergency']).optional(),
  reason: z.string().min(1, 'Reason is required'),
  appointmentDate: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  notes: z.string().optional()
})

// Drug validation schema
export const drugCreateSchema = z.object({
  name: z.string().min(1, 'Drug name is required'),
  category: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().nonnegative().optional(),
  quantityInStock: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(10)
})

// Lab test validation schema
export const labTestCreateSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  category: z.string().optional(),
  price: z.number().nonnegative().optional(),
  turnaroundTime: z.string().optional()
})

// User/Staff validation schema
export const userCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']),
  department: z.string().optional(),
  initials: z.string().max(5).optional(),
  phone: phoneSchema.optional()
})

// Billing validation schema
export const billCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative()
  })).min(1, 'At least one item is required'),
  discount: z.number().nonnegative().optional().default(0),
  notes: z.string().optional()
})

// Payment validation schema
export const paymentCreateSchema = z.object({
  billId: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'insurance', 'wallet']),
  reference: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional()
})

// Routing request validation schema
export const routingRequestCreateSchema = z.object({
  receiver_id: z.string().optional(),
  receiver_role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']).optional(),
  receiver_department: z.string().optional(),
  patient_id: z.string().optional(),
  patient_name: z.string().optional(),
  request_type: z.enum(['consultation', 'lab_test', 'prescription', 'review', 'referral', 'other']),
  priority: z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().optional(),
  consultation_id: z.string().optional(),
  lab_request_id: z.string().optional(),
  prescription_id: z.string().optional()
})

/**
 * Validate data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns either success or error
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  }
  
  return errors
}
