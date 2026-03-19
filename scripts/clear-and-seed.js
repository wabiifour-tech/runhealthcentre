// Database Management Script
// Clears all data and seeds test users for PostgreSQL (Neon)

const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

// Neon PostgreSQL database URL
const DATABASE_URL = 'postgresql://neondb_owner:npg_PeIowL8jSu2A@ep-empty-dream-alrd8nqa-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔍 Checking current data...')
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users')
    const patientCount = await pool.query('SELECT COUNT(*) FROM patients')
    
    console.log(`Current users: ${userCount.rows[0].count}`)
    console.log(`Current patients: ${patientCount.rows[0].count}`)

    console.log('\n🗑️ Clearing all data...')
    
    // Clear tables that exist
    const tablesToClear = [
      'routing_requests',
      'notifications',
      'dispensed_drugs',
      'prescriptions',
      'lab_results',
      'lab_requests',
      'vital_signs',
      'consultations',
      'queue_entries',
      'patients',
      'drugs',
      'lab_tests',
      'users'
    ]
    
    for (const table of tablesToClear) {
      try {
        await pool.query(`DELETE FROM ${table}`)
        console.log(`  ✓ Cleared ${table}`)
      } catch (err) {
        console.log(`  ⚠ Skipped ${table} (${err.message})`)
      }
    }

    console.log('\n👤 Creating test users...')
    
    const password = await bcrypt.hash('Test@123456', 10)
    const users = [
      { id: uuidv4(), email: 'superadmin@ruhc', name: 'Super Admin', role: 'SUPER_ADMIN' },
      { id: uuidv4(), email: 'admin@ruhc', name: 'Admin User', role: 'ADMIN' },
      { id: uuidv4(), email: 'doctor@ruhc', name: 'Dr. John Smith', role: 'DOCTOR' },
      { id: uuidv4(), email: 'nurse@ruhc', name: 'Nurse Jane Doe', role: 'NURSE' },
      { id: uuidv4(), email: 'pharmacist@ruhc', name: 'Pharmacist Bob', role: 'PHARMACIST' },
      { id: uuidv4(), email: 'labtech@ruhc', name: 'Lab Tech Alice', role: 'LAB_TECHNICIAN' },
      { id: uuidv4(), email: 'matron@ruhc', name: 'Matron Carol', role: 'MATRON' },
      { id: uuidv4(), email: 'records@ruhc', name: 'Records Officer Dan', role: 'RECORDS_OFFICER' }
    ]
    
    for (const user of users) {
      await pool.query(`
        INSERT INTO users (id, email, name, password, role, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, true, false, 'APPROVED', NOW(), NOW())
      `, [user.id, user.email, user.name, password, user.role])
      console.log(`  ✓ Created ${user.role}: ${user.email}`)
    }

    console.log('\n💊 Seeding drugs...')
    const drugs = [
      { id: uuidv4(), name: 'Paracetamol', category: 'Analgesic', dosageForm: 'Tablet', strength: '500mg', price: 100 },
      { id: uuidv4(), name: 'Amoxicillin', category: 'Antibiotic', dosageForm: 'Capsule', strength: '250mg', price: 200 },
      { id: uuidv4(), name: 'Ibuprofen', category: 'NSAID', dosageForm: 'Tablet', strength: '400mg', price: 150 },
      { id: uuidv4(), name: 'Metformin', category: 'Antidiabetic', dosageForm: 'Tablet', strength: '500mg', price: 250 },
      { id: uuidv4(), name: 'Omeprazole', category: 'PPI', dosageForm: 'Capsule', strength: '20mg', price: 300 },
      { id: uuidv4(), name: 'Ciprofloxacin', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg', price: 350 },
      { id: uuidv4(), name: 'Loratadine', category: 'Antihistamine', dosageForm: 'Tablet', strength: '10mg', price: 180 },
      { id: uuidv4(), name: 'Diclofenac', category: 'NSAID', dosageForm: 'Tablet', strength: '50mg', price: 220 }
    ]
    
    for (const drug of drugs) {
      await pool.query(`
        INSERT INTO drugs (id, name, category, "dosageForm", strength, price, "quantityInStock", "isActive", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, 100, true, NOW())
      `, [drug.id, drug.name, drug.category, drug.dosageForm, drug.strength, drug.price])
    }
    console.log(`  ✓ Created ${drugs.length} drugs`)

    console.log('\n🧪 Seeding lab tests...')
    const labTests = [
      { id: uuidv4(), name: 'Complete Blood Count', category: 'Hematology', price: 2000, turnaroundTime: '2 hours' },
      { id: uuidv4(), name: 'Malaria Parasite', category: 'Parasitology', price: 1000, turnaroundTime: '1 hour' },
      { id: uuidv4(), name: 'Urinalysis', category: 'Chemical Pathology', price: 1500, turnaroundTime: '1 hour' },
      { id: uuidv4(), name: 'Blood Glucose', category: 'Chemical Pathology', price: 500, turnaroundTime: '30 mins' },
      { id: uuidv4(), name: 'HIV Screening', category: 'Serology', price: 2000, turnaroundTime: '2 hours' },
      { id: uuidv4(), name: 'Widal Test', category: 'Serology', price: 1500, turnaroundTime: '2 hours' },
      { id: uuidv4(), name: 'Pregnancy Test', category: 'Serology', price: 1000, turnaroundTime: '30 mins' },
      { id: uuidv4(), name: 'Liver Function Test', category: 'Chemical Pathology', price: 5000, turnaroundTime: '4 hours' }
    ]
    
    for (const test of labTests) {
      await pool.query(`
        INSERT INTO lab_tests (id, name, category, price, "turnaroundTime", "isActive", "createdAt")
        VALUES ($1, $2, $3, $4, $5, true, NOW())
      `, [test.id, test.name, test.category, test.price, test.turnaroundTime])
    }
    console.log(`  ✓ Created ${labTests.length} lab tests`)

    // Verify data
    console.log('\n📊 Final counts:')
    const finalUserCount = await pool.query('SELECT COUNT(*) FROM users')
    const finalPatientCount = await pool.query('SELECT COUNT(*) FROM patients')
    const drugCount = await pool.query('SELECT COUNT(*) FROM drugs')
    const labTestCount = await pool.query('SELECT COUNT(*) FROM lab_tests')
    
    console.log(`  Users: ${finalUserCount.rows[0].count}`)
    console.log(`  Patients: ${finalPatientCount.rows[0].count}`)
    console.log(`  Drugs: ${drugCount.rows[0].count}`)
    console.log(`  Lab Tests: ${labTestCount.rows[0].count}`)

    console.log('\n✅ Database seeding complete!')
    console.log('\n🔐 Test Credentials:')
    console.log('  All users: password = Test@123456')
    console.log('  Emails: superadmin@ruhc, admin@ruhc, doctor@ruhc, nurse@ruhc,')
    console.log('          pharmacist@ruhc, labtech@ruhc, matron@ruhc, records@ruhc')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

main()
