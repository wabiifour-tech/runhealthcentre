// Database Management Script
// Clears all data and seeds test users

import pg from 'pg'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const { Pool } = pg
const bcrypt = bcryptjs

// Production database URL
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
    
    // List of tables to clear in order (only existing tables)
    const tablesToDelete = [
      'notification_recipients',
      'notification_logs', 
      'notification_queue',
      'notifications',
      'notification_templates',
      'user_notification_preferences',
      'user_devices',
      'wallet_transactions',
      'patient_wallets',
      'dispensed_drugs',
      'prescriptions',
      'lab_results',
      'lab_requests',
      'consultations',
      'vital_signs',
      'queue_entries',
      'appointments',
      'routing_requests',
      'patient_tasks',
      'medication_administrations',
      'admissions',
      'patients',
      'audit_logs',
      'attendance',
      'rosters',
      'announcements',
      'voice_notes',
      'medical_certificates',
      'referral_letters',
      'discharge_summaries',
      'users'
    ]

    // Delete from each table if it exists
    for (const table of tablesToDelete) {
      try {
        await pool.query(`DELETE FROM ${table}`)
        console.log(`  ✓ Cleared ${table}`)
      } catch (e) {
        if (e.code === '42P01') {
          console.log(`  - Skipped ${table} (doesn't exist)`)
        } else {
          console.log(`  ⚠ Error on ${table}: ${e.message}`)
        }
      }
    }

    console.log('\n✅ Data clearing complete!')

    console.log('\n👤 Creating test users for each role...')
    
    const hashedPassword = await bcrypt.hash('Test@123', 10)
    
    const testUsers = [
      { id: uuidv4(), email: 'superadmin@ruhc', name: 'Super Admin', role: 'SUPER_ADMIN', department: 'Administration' },
      { id: uuidv4(), email: 'admin@ruhc', name: 'Admin User', role: 'ADMIN', department: 'Administration' },
      { id: uuidv4(), email: 'doctor@ruhc', name: 'Dr. John Smith', role: 'DOCTOR', department: 'General Medicine' },
      { id: uuidv4(), email: 'nurse@ruhc', name: 'Nurse Jane Doe', role: 'NURSE', department: 'Nursing' },
      { id: uuidv4(), email: 'pharmacist@ruhc', name: 'Pharmacist Mike', role: 'PHARMACIST', department: 'Pharmacy' },
      { id: uuidv4(), email: 'labtech@ruhc', name: 'Lab Tech Sarah', role: 'LAB_TECHNICIAN', department: 'Laboratory' },
      { id: uuidv4(), email: 'matron@ruhc', name: 'Matron Grace', role: 'MATRON', department: 'Nursing' },
      { id: uuidv4(), email: 'records@ruhc', name: 'Records Officer', role: 'RECORDS_OFFICER', department: 'Records' }
    ]

    for (const user of testUsers) {
      await pool.query(`
        INSERT INTO users (id, email, name, password, role, department, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, true, false, 'APPROVED', NOW(), NOW())
      `, [user.id, user.email, user.name, hashedPassword, user.role, user.department])
      
      console.log(`✅ Created: ${user.role} - ${user.email}`)
    }

    console.log('\n📊 Final count:')
    const finalUserCount = await pool.query('SELECT COUNT(*) FROM users')
    const finalPatientCount = await pool.query('SELECT COUNT(*) FROM patients')
    console.log(`Users: ${finalUserCount.rows[0].count}`)
    console.log(`Patients: ${finalPatientCount.rows[0].count}`)

    console.log('\n✨ Done! All test accounts created with password: Test@123')
    console.log('\n📋 Login credentials:')
    testUsers.forEach(u => console.log(`  ${u.role.padEnd(18)} | ${u.email.padEnd(20)} | Test@123`))

  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

main()
