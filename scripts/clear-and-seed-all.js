// Script to clear all data and seed test accounts for all roles
const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Password for all test accounts
const TEST_PASSWORD = 'Test@123456'
const PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 12)

// Test accounts for all roles
const TEST_ACCOUNTS = [
  {
    id: 'super-admin-001',
    email: 'superadmin@ruhc',
    name: 'Super Admin',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    department: 'Administration',
    initials: 'SA',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'admin-001',
    email: 'admin@ruhc',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    department: 'Administration',
    initials: 'AU',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'doctor-001',
    email: 'doctor@ruhc',
    name: 'Dr. John Smith',
    firstName: 'John',
    lastName: 'Smith',
    role: 'DOCTOR',
    department: 'OPD',
    initials: 'DJS',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'nurse-001',
    email: 'nurse@ruhc',
    name: 'Nurse Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'NURSE',
    department: 'OPD',
    initials: 'NJD',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'pharmacist-001',
    email: 'pharmacist@ruhc',
    name: 'Pharm. Mike Brown',
    firstName: 'Mike',
    lastName: 'Brown',
    role: 'PHARMACIST',
    department: 'Pharmacy',
    initials: 'PMB',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'lab-tech-001',
    email: 'labtech@ruhc',
    name: 'Lab Tech. Sarah Wilson',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'LAB_TECHNICIAN',
    department: 'Laboratory',
    initials: 'LSW',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'matron-001',
    email: 'matron@ruhc',
    name: 'Matron Grace Johnson',
    firstName: 'Grace',
    lastName: 'Johnson',
    role: 'MATRON',
    department: 'Nursing',
    initials: 'MGJ',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  },
  {
    id: 'records-001',
    email: 'records@ruhc',
    name: 'Records Officer Tom Davis',
    firstName: 'Tom',
    lastName: 'Davis',
    role: 'RECORDS_OFFICER',
    department: 'Records',
    initials: 'RTD',
    password: PASSWORD_HASH,
    viewablePassword: TEST_PASSWORD,
    isFirstLogin: false,
    isActive: true,
    approvalStatus: 'APPROVED'
  }
]

async function clearAndSeed() {
  console.log('🧹 Starting database cleanup and seeding...\n')

  try {
    // Clear all tables in order (respecting foreign keys)
    console.log('Clearing all data...')
    
    await prisma.dispensed_drugs.deleteMany({})
    console.log('  ✅ Cleared dispensed_drugs')
    
    await prisma.lab_results.deleteMany({})
    console.log('  ✅ Cleared lab_results')
    
    await prisma.lab_requests.deleteMany({})
    console.log('  ✅ Cleared lab_requests')
    
    await prisma.prescriptions.deleteMany({})
    console.log('  ✅ Cleared prescriptions')
    
    await prisma.routing_requests.deleteMany({})
    console.log('  ✅ Cleared routing_requests')
    
    await prisma.notifications.deleteMany({})
    console.log('  ✅ Cleared notifications')
    
    await prisma.queue_entries.deleteMany({})
    console.log('  ✅ Cleared queue_entries')
    
    await prisma.consultations.deleteMany({})
    console.log('  ✅ Cleared consultations')
    
    await prisma.vital_signs.deleteMany({})
    console.log('  ✅ Cleared vital_signs')
    
    await prisma.patients.deleteMany({})
    console.log('  ✅ Cleared patients')
    
    // Clear all users
    await prisma.users.deleteMany({})
    console.log('  ✅ Cleared users')
    
    // Clear drugs and lab tests
    await prisma.drugs.deleteMany({})
    console.log('  ✅ Cleared drugs')
    
    await prisma.lab_tests.deleteMany({})
    console.log('  ✅ Cleared lab_tests')

    console.log('\n🌱 Seeding test accounts...')
    
    // Seed all test accounts
    for (const account of TEST_ACCOUNTS) {
      await prisma.users.create({ data: account })
      console.log(`  ✅ Created ${account.role}: ${account.name} (${account.email})`)
    }

    // Seed some basic drugs
    const drugs = [
      { id: 'd1', name: 'Paracetamol', category: 'Analgesic', dosageForm: 'Tablet', strength: '500mg', quantityInStock: 500, reorderLevel: 100, price: 200 },
      { id: 'd2', name: 'Ibuprofen', category: 'NSAID', dosageForm: 'Tablet', strength: '400mg', quantityInStock: 200, reorderLevel: 50, price: 300 },
      { id: 'd3', name: 'Amoxicillin', category: 'Antibiotic', dosageForm: 'Capsule', strength: '500mg', quantityInStock: 200, reorderLevel: 50, price: 500 },
      { id: 'd4', name: 'Artemether/Lumefantrine', category: 'Antimalarial', dosageForm: 'Tablet', strength: '20/120mg', quantityInStock: 200, reorderLevel: 50, price: 1500 },
      { id: 'd5', name: 'Metronidazole', category: 'Antibiotic', dosageForm: 'Tablet', strength: '400mg', quantityInStock: 150, reorderLevel: 30, price: 400 },
      { id: 'd6', name: 'Ciprofloxacin', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg', quantityInStock: 150, reorderLevel: 30, price: 600 },
      { id: 'd7', name: 'Omeprazole', category: 'PPI', dosageForm: 'Capsule', strength: '20mg', quantityInStock: 100, reorderLevel: 30, price: 400 },
      { id: 'd8', name: 'ORS', category: 'Rehydration', dosageForm: 'Sachet', strength: '20.5g', quantityInStock: 100, reorderLevel: 30, price: 200 },
    ]
    
    for (const drug of drugs) {
      await prisma.drugs.create({ data: drug })
    }
    console.log(`  ✅ Created ${drugs.length} drugs`)

    // Seed some basic lab tests
    const labTests = [
      { id: 'lt1', name: 'Full Blood Count', category: 'Hematology', price: 2000, turnaroundTime: '2 hours' },
      { id: 'lt2', name: 'Malaria Parasite', category: 'Parasitology', price: 1000, turnaroundTime: '30 mins' },
      { id: 'lt3', name: 'Urinalysis', category: 'Chemical Pathology', price: 1000, turnaroundTime: '30 mins' },
      { id: 'lt4', name: 'Blood Group', category: 'Hematology', price: 500, turnaroundTime: '15 mins' },
      { id: 'lt5', name: 'Genotype', category: 'Hematology', price: 1000, turnaroundTime: '1 hour' },
      { id: 'lt6', name: 'Random Blood Sugar', category: 'Chemical Pathology', price: 500, turnaroundTime: '15 mins' },
      { id: 'lt7', name: 'Widal Test', category: 'Serology', price: 1500, turnaroundTime: '1 hour' },
      { id: 'lt8', name: 'Pregnancy Test', category: 'Serology', price: 500, turnaroundTime: '15 mins' },
    ]
    
    for (const test of labTests) {
      await prisma.lab_tests.create({ data: test })
    }
    console.log(`  ✅ Created ${labTests.length} lab tests`)

    console.log('\n✨ Database cleanup and seeding complete!')
    
    console.log('\n📋 TEST ACCOUNTS (Password for all: Test@123456):')
    console.log('=' .repeat(60))
    for (const account of TEST_ACCOUNTS) {
      console.log(`  ${account.role.padEnd(18)} | ${account.email.padEnd(20)} | ${account.name}`)
    }
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAndSeed()
