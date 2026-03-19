const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_PeIowL8jSu2A@ep-empty-dream-alrd8nqa-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  max: 2,
  ssl: { rejectUnauthorized: false }
});

async function seedProduction() {
  const password = 'Test@123456';
  const hashedPassword = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const users = [
    { id: 'super-admin-001', email: 'superadmin@ruhc', name: 'Super Admin', role: 'SUPER_ADMIN', department: 'Administration', initials: 'SA' },
    { id: 'admin-001', email: 'admin@rucf', name: 'Admin User', role: 'ADMIN', department: 'Administration', initials: 'AU' },
    { id: 'doctor-001', email: 'doctor@ruhc', name: 'Dr. John Smith', role: 'DOCTOR', department: 'OPD', initials: 'DJS' },
    { id: 'nurse-001', email: 'nurse@ruhc', name: 'Nurse Jane Doe', role: 'NURSE', department: 'OPD', initials: 'NJD' },
    { id: 'pharmacist-001', email: 'pharmacist@ruhc', name: 'Pharm. Mike Brown', role: 'PHARMACIST', department: 'Pharmacy', initials: 'PMB' },
    { id: 'lab-tech-001', email: 'labtech@ruhc', name: 'Lab Tech. Sarah Wilson', role: 'LAB_TECHNICIAN', department: 'Laboratory', initials: 'LSW' },
    { id: 'matron-001', email: 'matron@ruhc', name: 'Matron Grace Johnson', role: 'MATRON', department: 'Nursing', initials: 'MGJ' },
    { id: 'records-001', email: 'records@ruhc', name: 'Records Officer Tom Davis', role: 'RECORDS_OFFICER', department: 'Records', initials: 'RTD' }
  ];

  try {
    console.log('🧹 Clearing users...');
    await pool.query('DELETE FROM users');
    console.log('  ✅ Cleared users');
  } catch (e) {
    console.log('  ℹ️ Table might be empty');
  }

  console.log('\n🌱 Seeding users...');
  for (const user of users) {
    try {
      await pool.query(`
        INSERT INTO users (id, email, name, password, role, department, initials, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, 'APPROVED', $8, $8)
      `, [user.id, user.email, user.name, hashedPassword, user.role, user.department, user.initials, now, now]);
      console.log(`  ✅ Created: ${user.role} - ${user.email}`);
    } catch (e) {
      console.log(`  ⚠️ Error: ${e.message}`);
    }
  }

  const result = await pool.query('SELECT email, name, role FROM users');
  console.log('\n📋 Users in production:');
  console.table(result.rows);
  await pool.end();
}

seedProduction();
