-- ============================================
-- RUN Health Centre - Enable RLS on Existing Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's see what tables we have
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Enable RLS on existing tables (based on actual table names in your database)
-- Users table (lowercase)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "users" FOR ALL USING (true) WITH CHECK (true);

-- App settings
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "app_settings" FOR ALL USING (true) WITH CHECK (true);

-- Capital case tables (these are the ones that exist in your database)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "User" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Patient" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Appointment" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "VitalSign" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "VitalSign" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Consultation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Consultation" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Drug" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Drug" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "MedicationAdministration" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "MedicationAdministration" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "LabRequest" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "LabRequest" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "LabTest" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "LabTest" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "LabResult" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "LabResult" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Payment" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Announcement" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "AuditLog" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Admission" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Admission" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "PatientWallet" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "PatientWallet" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "WalletTransaction" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "RosterEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "RosterEntry" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "ImmunizationRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "ImmunizationRecord" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "QueueEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "QueueEntry" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "OpenHeavensDevotional" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "OpenHeavensDevotional" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "InventoryItem" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated service" ON "Equipment" FOR ALL USING (true) WITH CHECK (true);
