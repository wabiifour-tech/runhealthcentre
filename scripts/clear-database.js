// Script to clear all data from the HMS database
const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function clearAllData() {
  console.log('🧹 Starting database cleanup...\n')

  try {
    // Clear all patient-related data first (due to foreign key constraints)
    console.log('Clearing vital_signs...')
    const vitals = await prisma.vital_signs.deleteMany({})
    console.log(`  ✅ Deleted ${vitals.count} vital signs records`)

    console.log('Clearing consultations...')
    const consults = await prisma.consultations.deleteMany({})
    console.log(`  ✅ Deleted ${consults.count} consultations`)

    console.log('Clearing lab_requests...')
    const labReqs = await prisma.lab_requests.deleteMany({})
    console.log(`  ✅ Deleted ${labReqs.count} lab requests`)

    console.log('Clearing lab_results...')
    const labResults = await prisma.lab_results.deleteMany({})
    console.log(`  ✅ Deleted ${labResults.count} lab results`)

    console.log('Clearing prescriptions...')
    const prescriptions = await prisma.prescriptions.deleteMany({})
    console.log(`  ✅ Deleted ${prescriptions.count} prescriptions`)

    console.log('Clearing queue_entries...')
    const queue = await prisma.queue_entries.deleteMany({})
    console.log(`  ✅ Deleted ${queue.count} queue entries`)

    console.log('Clearing appointments...')
    const appointments = await prisma.appointments.deleteMany({})
    console.log(`  ✅ Deleted ${appointments.count} appointments`)

    console.log('Clearing admissions...')
    const admissions = await prisma.admissions.deleteMany({})
    console.log(`  ✅ Deleted ${admissions.count} admissions`)

    console.log('Clearing medical_certificates...')
    const certs = await prisma.medical_certificates.deleteMany({})
    console.log(`  ✅ Deleted ${certs.count} medical certificates`)

    console.log('Clearing referral_letters...')
    const referrals = await prisma.referral_letters.deleteMany({})
    console.log(`  ✅ Deleted ${referrals.count} referral letters`)

    console.log('Clearing discharge_summaries...')
    const discharge = await prisma.discharge_summaries.deleteMany({})
    console.log(`  ✅ Deleted ${discharge.count} discharge summaries`)

    console.log('Clearing announcements...')
    const announcements = await prisma.announcements.deleteMany({})
    console.log(`  ✅ Deleted ${announcements.count} announcements`)

    console.log('Clearing voice_notes...')
    const voiceNotes = await prisma.voice_notes.deleteMany({})
    console.log(`  ✅ Deleted ${voiceNotes.count} voice notes`)

    console.log('Clearing rosters...')
    const rosters = await prisma.rosters.deleteMany({})
    console.log(`  ✅ Deleted ${rosters.count} roster entries`)

    console.log('Clearing attendance...')
    const attendance = await prisma.attendance.deleteMany({})
    console.log(`  ✅ Deleted ${attendance.count} attendance records`)

    console.log('Clearing patients...')
    const patients = await prisma.patients.deleteMany({})
    console.log(`  ✅ Deleted ${patients.count} patients`)

    // Clear all staff except SUPER_ADMIN
    console.log('Clearing staff accounts (keeping SUPER_ADMIN)...')
    const staff = await prisma.users.deleteMany({
      where: {
        NOT: {
          role: 'SUPER_ADMIN'
        }
      }
    })
    console.log(`  ✅ Deleted ${staff.count} staff accounts`)

    console.log('\n✨ Database cleanup complete!')
    console.log('\nRemaining accounts:')
    const remainingUsers = await prisma.users.findMany({
      select: { id: true, email: true, name: true, role: true }
    })
    console.log(remainingUsers)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllData()
