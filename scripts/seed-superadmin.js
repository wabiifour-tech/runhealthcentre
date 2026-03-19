// Script to seed SUPER_ADMIN account
const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Bcrypt hash for SuperAdmin password "#Abolaji7977"
const SUPERADMIN_PASSWORD_HASH = '$2b$12$KIl2rrn4SNdHn2fuH0STsejTZrL7gTCOGtxajJMPEAjppo9ybG5aC'

async function seedSuperAdmin() {
  console.log('🌱 Seeding SUPER_ADMIN account...\n')

  try {
    const now = new Date().toISOString()
    
    const superAdmin = {
      id: 'super-admin-001',
      email: 'wabithetechnurse@ruhc',
      name: 'Wabi The Tech Nurse',
      role: 'SUPER_ADMIN',
      department: 'Administration',
      initials: 'WTN',
      password: SUPERADMIN_PASSWORD_HASH,
      isFirstLogin: false,
      isActive: true,
      approvalStatus: 'APPROVED',
      createdAt: now
    }

    const existing = await prisma.users.findUnique({
      where: { email: superAdmin.email }
    })

    if (existing) {
      await prisma.users.update({
        where: { email: superAdmin.email },
        data: {
          password: superAdmin.password,
          isActive: true,
          approvalStatus: 'APPROVED'
        }
      })
      console.log('✅ Updated existing SUPER_ADMIN account')
    } else {
      await prisma.users.create({
        data: superAdmin
      })
      console.log('✅ Created new SUPER_ADMIN account')
    }

    console.log('\n📋 SUPER_ADMIN Credentials:')
    console.log('   Email: wabithetechnurse@ruhc')
    console.log('   Password: #Abolaji7977')

    console.log('\n📋 All users in database:')
    const users = await prisma.users.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true }
    })
    console.log(users)

  } catch (error) {
    console.error('❌ Error seeding SUPER_ADMIN:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSuperAdmin()
