/**
 * Database Performance Indexes
 * 
 * Run this to add critical indexes to the database for optimal query performance.
 * This can be run as a migration or via the admin API.
 */

export const PERFORMANCE_INDEXES = `
-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_ruhc_code ON patients(ruhc_code);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_number ON patients("hospitalNumber");
CREATE INDEX IF NOT EXISTS idx_patients_matric_number ON patients("matricNumber");
CREATE INDEX IF NOT EXISTS idx_patients_registered_at ON patients("registeredAt");
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients("isActive");

-- Consultation indexes
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations("patientId");
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations("doctorId");
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_referred_to ON consultations("referredTo");
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations("createdAt");

-- Vital signs indexes
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs("patientId");
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs("recordedAt");
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_by ON vital_signs("recordedBy");

-- Lab requests indexes
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient_id ON lab_requests("patientId");
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_requested_at ON lab_requests("requestedAt");

-- Lab results indexes
CREATE INDEX IF NOT EXISTS idx_lab_results_request_id ON lab_results("requestId");
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results("patientId");

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions("patientId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions("createdAt");

-- Queue entries indexes
CREATE INDEX IF NOT EXISTS idx_queue_entries_patient_id ON queue_entries("patientId");
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_unit ON queue_entries(unit);
CREATE INDEX IF NOT EXISTS idx_queue_entries_checked_in_at ON queue_entries("checkedInAt");

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments("doctorId");
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments("appointmentDate");

-- Admissions indexes
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions("patientId");
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_admitted_at ON admissions("admittedAt");

-- Drugs indexes
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_drugs_category ON drugs(category);
CREATE INDEX IF NOT EXISTS idx_drugs_is_active ON drugs("isActive");

-- Lab tests indexes
CREATE INDEX IF NOT EXISTS idx_lab_tests_name ON lab_tests(name);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_is_active ON lab_tests("isActive");

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users("approvalStatus");

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Routing requests indexes (already in schema)
-- CREATE INDEX IF NOT EXISTS idx_routing_requests_receiver_id ON routing_requests(receiver_id);
-- CREATE INDEX IF NOT EXISTS idx_routing_requests_status ON routing_requests(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");

-- Bills indexes
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON bills("patientId");
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills("createdAt");

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments("patientId");
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments("billId");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity ON inventory_items("quantityInStock");

-- Staff attendance indexes
CREATE INDEX IF NOT EXISTS idx_staff_attendances_staff_id ON staff_attendances("staffId");
CREATE INDEX IF NOT EXISTS idx_staff_attendances_date ON staff_attendances(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendances_status ON staff_attendances(status);

-- Blood bank indexes
CREATE INDEX IF NOT EXISTS idx_blood_donors_blood_group ON blood_donors("bloodGroup");
CREATE INDEX IF NOT EXISTS idx_blood_units_blood_group ON blood_units("bloodGroup");
CREATE INDEX IF NOT EXISTS idx_blood_units_status ON blood_units(status);

-- Patient wallet indexes
CREATE INDEX IF NOT EXISTS idx_patient_wallets_patient_id ON patient_wallets("patientId");
`

/**
 * Apply performance indexes to the database
 */
export async function applyPerformanceIndexes(prisma: any): Promise<{ applied: number; errors: string[] }> {
  const errors: string[] = []
  let applied = 0
  
  // Split into individual statements
  const statements = PERFORMANCE_INDEXES
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toUpperCase().startsWith('CREATE'))
  
  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement + ';')
      applied++
    } catch (error: any) {
      // Ignore "already exists" errors
      if (!error.message?.includes('already exists')) {
        errors.push(`${statement.substring(0, 50)}...: ${error.message}`)
      }
    }
  }
  
  return { applied, errors }
}
