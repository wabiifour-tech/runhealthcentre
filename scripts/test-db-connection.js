// Test PostgreSQL Connection with standard pg
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('../src/generated/prisma/client')

const DATABASE_URL = 'postgresql://neondb_owner:npg_PeIowL8jSu2A@ep-empty-dream-alrd8nqa-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'

async function test() {
  console.log('Testing Neon PostgreSQL connection...\n')

  // Test 1: Direct pool connection
  console.log('Test 1: Direct Pool Connection')
  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    const result = await pool.query('SELECT NOW() as now')
    console.log('✅ Pool connection successful:', result.rows[0].now)
  } catch (err) {
    console.log('❌ Pool connection failed:', err.message)
  }
  await pool.end()

  // Test 2: Prisma with PrismaPg adapter
  console.log('\nTest 2: Prisma with PrismaPg Adapter (using standard pg)')
  const pool2 = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1
  })
  const adapter = new PrismaPg(pool2)
  const prisma = new PrismaClient({ adapter })

  try {
    const users = await prisma.users.findMany()
    console.log('✅ Prisma connection successful!')
    console.log(`   Found ${users.length} users`)
    
    // Test creating a patient
    console.log('\nTest 3: Create Patient via Prisma')
    const testPatient = await prisma.patients.create({
      data: {
        id: 'test-' + Date.now(),
        ruhcCode: 'RUHC-TEST-' + Date.now(),
        firstName: 'Test',
        lastName: 'Patient',
        gender: 'Male',
        phone: '08012345678'
      }
    })
    console.log('✅ Patient created:', testPatient.ruhcCode)
    
    // Verify it persists
    console.log('\nTest 4: Verify Patient Persists')
    const found = await prisma.patients.findUnique({
      where: { ruhcCode: testPatient.ruhcCode }
    })
    if (found) {
      console.log('✅ Patient found in database:', found.firstName, found.lastName)
    } else {
      console.log('❌ Patient NOT found!')
    }
    
    // List all patients
    console.log('\nTest 5: List All Patients')
    const allPatients = await prisma.patients.findMany()
    console.log(`   Found ${allPatients.length} patients:`)
    allPatients.forEach(p => console.log(`   - ${p.ruhcCode}: ${p.firstName} ${p.lastName}`))
    
    // Clean up test patient
    await prisma.patients.delete({ where: { id: testPatient.id } })
    console.log('\n✅ Test patient cleaned up')
    
  } catch (err) {
    console.log('❌ Prisma test failed:', err.message)
    console.log(err.stack)
  } finally {
    await prisma.$disconnect()
    await pool2.end()
  }

  console.log('\n✅ All tests completed!')
}

test()
