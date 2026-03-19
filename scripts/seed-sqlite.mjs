// Seed SQLite database with test users
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '..', 'db', 'custom.db')

console.log('Database path:', dbPath)

const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

async function main() {
  try {
    // Check current users
    const currentUsers = db.prepare('SELECT email, role FROM users').all()
    console.log('\n📋 Current users:', currentUsers.length)
    currentUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`))

    // Clear existing users (except the original superadmin)
    console.log('\n🗑️ Clearing old test users...')
    db.prepare(`DELETE FROM users WHERE email != 'wabithetechnurse@ruhc'`).run()
    
    // Create hashed password
    const hashedPassword = await bcrypt.hash('Test@123', 10)
    
    // Test users
    const testUsers = [
      { email: 'superadmin@ruhc', name: 'Super Admin', role: 'SUPER_ADMIN', department: 'Administration' },
      { email: 'admin@ruhc', name: 'Admin User', role: 'ADMIN', department: 'Administration' },
      { email: 'doctor@ruhc', name: 'Dr. John Smith', role: 'DOCTOR', department: 'General Medicine' },
      { email: 'nurse@ruhc', name: 'Nurse Jane Doe', role: 'NURSE', department: 'Nursing' },
      { email: 'pharmacist@ruhc', name: 'Pharmacist Mike', role: 'PHARMACIST', department: 'Pharmacy' },
      { email: 'labtech@ruhc', name: 'Lab Tech Sarah', role: 'LAB_TECHNICIAN', department: 'Laboratory' },
      { email: 'matron@ruhc', name: 'Matron Grace', role: 'MATRON', department: 'Nursing' },
      { email: 'records@ruhc', name: 'Records Officer', role: 'RECORDS_OFFICER', department: 'Records' }
    ]

    console.log('\n👤 Creating test users...')
    
    const insertStmt = db.prepare(`
      INSERT INTO users (id, email, name, password, role, department, "isActive", "isFirstLogin", "approvalStatus", "createdAt", "updatedAt")
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, 'APPROVED', datetime('now'), datetime('now'))
    `)

    for (const user of testUsers) {
      const id = uuidv4()
      try {
        insertStmt.run(id, user.email, user.name, hashedPassword, user.role, user.department)
        console.log(`✅ Created: ${user.role} - ${user.email}`)
      } catch (e) {
        console.log(`⚠️  Error creating ${user.email}: ${e.message}`)
      }
    }

    // Verify users
    const finalUsers = db.prepare('SELECT email, role, "isActive", "approvalStatus" FROM users').all()
    console.log('\n📊 Final users in database:')
    finalUsers.forEach(u => console.log(`  ${u.email.padEnd(25)} | ${u.role.padEnd(18)} | Active: ${u.isActive} | ${u.approvalStatus}`))

    console.log('\n✨ Done! All test accounts created.')
    console.log('\n📋 Login credentials (password: Test@123):')
    finalUsers.forEach(u => console.log(`  ${u.role.padEnd(18)} | ${u.email}`))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    db.close()
  }
}

main()
