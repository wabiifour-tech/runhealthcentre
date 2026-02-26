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

-- Create policies for Prisma tables (allow all for service role connection)
CREATE POLICY "Allow all for authenticated service" ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "patients" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "appointments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "consultations" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "vital_records" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "lab_tests" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "lab_orders" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "lab_order_items" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "medicines" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "prescriptions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "prescription_items" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "invoices" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "payments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "wards" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "beds" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "admissions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "inventory_items" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated service" ON "settings" FOR ALL USING (true) WITH CHECK (true);
