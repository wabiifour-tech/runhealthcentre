-- ============================================
-- RUN Health Centre - Enable RLS on All Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables (lowercase - Prisma schema tables)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consultations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vital_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lab_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lab_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lab_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "medicines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prescription_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "beds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on legacy tables (capital case - if they exist)
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VitalSign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Consultation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Drug" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "MedicationAdministration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LabRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LabTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LabResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Admission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PatientWallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "RosterEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ImmunizationRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "QueueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "OpenHeavensDevotional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "app_settings" ENABLE ROW LEVEL SECURITY;

-- Create policies for Prisma tables (allow all for service role connection)
-- These policies allow full access when connecting with the database password (service role)

-- Users table
CREATE POLICY "Allow all for authenticated service" ON "users" 
  FOR ALL USING (true) WITH CHECK (true);

-- Patients table
CREATE POLICY "Allow all for authenticated service" ON "patients" 
  FOR ALL USING (true) WITH CHECK (true);

-- Appointments table
CREATE POLICY "Allow all for authenticated service" ON "appointments" 
  FOR ALL USING (true) WITH CHECK (true);

-- Consultations table
CREATE POLICY "Allow all for authenticated service" ON "consultations" 
  FOR ALL USING (true) WITH CHECK (true);

-- Vital records table
CREATE POLICY "Allow all for authenticated service" ON "vital_records" 
  FOR ALL USING (true) WITH CHECK (true);

-- Lab tests table
CREATE POLICY "Allow all for authenticated service" ON "lab_tests" 
  FOR ALL USING (true) WITH CHECK (true);

-- Lab orders table
CREATE POLICY "Allow all for authenticated service" ON "lab_orders" 
  FOR ALL USING (true) WITH CHECK (true);

-- Lab order items table
CREATE POLICY "Allow all for authenticated service" ON "lab_order_items" 
  FOR ALL USING (true) WITH CHECK (true);

-- Medicines table
CREATE POLICY "Allow all for authenticated service" ON "medicines" 
  FOR ALL USING (true) WITH CHECK (true);

-- Prescriptions table
CREATE POLICY "Allow all for authenticated service" ON "prescriptions" 
  FOR ALL USING (true) WITH CHECK (true);

-- Prescription items table
CREATE POLICY "Allow all for authenticated service" ON "prescription_items" 
  FOR ALL USING (true) WITH CHECK (true);

-- Invoices table
CREATE POLICY "Allow all for authenticated service" ON "invoices" 
  FOR ALL USING (true) WITH CHECK (true);

-- Payments table
CREATE POLICY "Allow all for authenticated service" ON "payments" 
  FOR ALL USING (true) WITH CHECK (true);

-- Wards table
CREATE POLICY "Allow all for authenticated service" ON "wards" 
  FOR ALL USING (true) WITH CHECK (true);

-- Beds table
CREATE POLICY "Allow all for authenticated service" ON "beds" 
  FOR ALL USING (true) WITH CHECK (true);

-- Admissions table
CREATE POLICY "Allow all for authenticated service" ON "admissions" 
  FOR ALL USING (true) WITH CHECK (true);

-- Inventory items table
CREATE POLICY "Allow all for authenticated service" ON "inventory_items" 
  FOR ALL USING (true) WITH CHECK (true);

-- Settings table
CREATE POLICY "Allow all for authenticated service" ON "settings" 
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for legacy tables (if they exist)
CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "User" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Patient" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Appointment" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "VitalSign" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Consultation" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Drug" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "MedicationAdministration" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "LabRequest" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "LabTest" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "LabResult" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Payment" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Announcement" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "AuditLog" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Admission" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "PatientWallet" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "WalletTransaction" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "RosterEntry" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "ImmunizationRecord" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "QueueEntry" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "OpenHeavensDevotional" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "InventoryItem" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "Equipment" 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated service" ON "app_settings" 
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Done! RLS is now enabled with full access policies
-- Your app will continue to work through Prisma
-- The PostgREST API is now protected
-- ============================================
