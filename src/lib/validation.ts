/**
 * STABILITY PROTECTIONS - Data Validation
 * 
 * All API inputs MUST be validated using schema validation.
 * Reject invalid data BEFORE database queries.
 */

import { z } from 'zod'

// ============== PATIENT VALIDATION ==============

export const patientCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  title: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  genotype: z.enum(['AA', 'AS', 'SS', 'AC', 'SC', 'CC']).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  patientType: z.enum(['Student', 'Academic Staff', 'Non-Academic Staff', 'Outsider']).optional(),
  matricNumber: z.string().max(50).optional(),
  hospitalNumber: z.string().max(50).optional(),
  allergies: z.string().max(1000).optional(),
  chronicConditions: z.string().max(1000).optional(),
  nokName: z.string().max(200).optional(),
  nokRelationship: z.string().max(50).optional(),
  nokPhone: z.string().max(20).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(20).optional()
})

export const patientUpdateSchema = patientCreateSchema.partial()

// ============== USER VALIDATION ==============

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'MATRON', 'RECORDS_OFFICER']),
  department: z.string().max(100).optional(),
  initials: z.string().max(10).optional(),
  phone: z.string().max(20).optional()
})

export const userUpdateSchema = userCreateSchema.partial().extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .optional()
})

// ============== APPOINTMENT VALIDATION ==============

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.string().max(50).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
})

export const appointmentUpdateSchema = appointmentCreateSchema.partial()

// ============== CONSULTATION VALIDATION ==============

export const consultationCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  chiefComplaint: z.string().max(500).optional(),
  historyOfPresentIllness: z.string().max(2000).optional(),
  pastMedicalHistory: z.string().max(2000).optional(),
  signsAndSymptoms: z.string().max(2000).optional(),
  provisionalDiagnosis: z.string().max(500).optional(),
  finalDiagnosis: z.string().max(500).optional(),
  treatmentPlan: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

// ============== VITAL SIGNS VALIDATION ==============

export const vitalSignsCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  temperature: z.string().max(10).optional(),
  bloodPressureSystolic: z.string().max(10).optional(),
  bloodPressureDiastolic: z.string().max(10).optional(),
  pulse: z.string().max(10).optional(),
  respiratoryRate: z.string().max(10).optional(),
  weight: z.string().max(10).optional(),
  height: z.string().max(10).optional(),
  oxygenSaturation: z.string().max(10).optional(),
  painScore: z.string().max(5).optional(),
  notes: z.string().max(500).optional()
})

// ============== PRESCRIPTION VALIDATION ==============

export const prescriptionCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  prescribedBy: z.string().optional(),
  medications: z.array(z.object({
    drugName: z.string().min(1, 'Drug name is required'),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    quantity: z.number().positive().optional(),
    instructions: z.string().optional()
  })).min(1, 'At least one medication is required'),
  notes: z.string().max(500).optional()
})

// ============== PAGINATION VALIDATION ==============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// ============== HELPER FUNCTIONS ==============

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError } 
{
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

export function formatZodErrors(errors: z.ZodError): string[] {
  return errors.issues.map(e => `${e.path.join('.')}: ${e.message}`)
}

export function formatZodErrorsString(errors: z.ZodError): string {
  return errors.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
}
