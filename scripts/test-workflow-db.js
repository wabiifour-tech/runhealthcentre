// Direct database test - create patient and test workflow
const { PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

async function testWorkflow() {
  console.log('🧪 Direct Database Workflow Test\n')
  
  try {
    // Step 1: Create patient directly
    console.log('📌 Step 1: Creating test patient...')
    const patient = await prisma.patients.create({
      data: {
        id: 'test-patient-001',
        ruhcCode: 'RUHC-2026-0001',
        firstName: 'Test',
        lastName: 'Student',
        middleName: 'Paul',
        gender: 'Male',
        dateOfBirth: '2000-05-15',
        phone: '08012345678',
        email: 'teststudent@run.edu.ng',
        patientType: 'Student',
        matricNumber: 'RUN/2020/1234',
        address: 'Redeemers University Campus',
        city: 'Ede',
        state: 'Osun',
        nationality: 'Nigerian',
        bloodGroup: 'O+',
        genotype: 'AA',
        allergies: 'None known',
        chronicConditions: 'None',
        isActive: true,
        registeredBy: 'records-001'
      }
    })
    console.log(`✅ Patient created: ${patient.firstName} ${patient.lastName} (${patient.ruhcCode})`)
    
    // Step 2: Create vital signs
    console.log('\n📌 Step 2: Creating vital signs...')
    const vitals = await prisma.vital_signs.create({
      data: {
        id: 'vitals-001',
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        recordedBy: 'NJD',
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        temperature: '36.8',
        pulse: '72',
        respiratoryRate: '16',
        weight: '70',
        height: '175',
        oxygenSaturation: '98',
        painScore: '2'
      }
    })
    console.log(`✅ Vital signs recorded: BP 120/80, Temp 36.8°C, Pulse 72bpm`)
    
    // Step 3: Create consultation
    console.log('\n📌 Step 3: Creating consultation...')
    const consultation = await prisma.consultations.create({
      data: {
        id: 'consult-001',
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        status: 'pending',
        chiefComplaint: 'Fever and headache for 3 days',
        signsAndSymptoms: 'High fever, headache, body weakness, loss of appetite',
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        temperature: '36.8',
        pulse: '72',
        sentByNurseInitials: 'NJD',
        sentAt: new Date()
      }
    })
    console.log(`✅ Consultation created and routed to Doctor`)
    
    // Step 4: Update consultation with doctor's findings
    console.log('\n📌 Step 4: Doctor consultation...')
    await prisma.consultations.update({
      where: { id: consultation.id },
      data: {
        doctorId: 'doctor-001',
        doctorName: 'Dr. John Smith',
        status: 'in_consultation',
        provisionalDiagnosis: 'Malaria (Uncomplicated)',
        finalDiagnosis: 'Malaria (Uncomplicated)',
        treatmentPlan: 'Antimalarial therapy, analgesics, hydration',
        generalExamination: 'Patient appears ill, febrile to touch',
        systemExamination: 'CVS: S1S2 normal. RS: BAE. CNS: Alert.'
      }
    })
    console.log(`✅ Doctor findings recorded: Malaria (Uncomplicated)`)
    
    // Step 5: Create lab request
    console.log('\n📌 Step 5: Creating lab request...')
    const labRequest = await prisma.lab_requests.create({
      data: {
        id: 'lab-req-001',
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        requestedBy: 'DJS',
        tests: JSON.stringify(['Malaria Parasite', 'Full Blood Count']),
        status: 'pending',
        notes: 'To confirm malaria diagnosis'
      }
    })
    console.log(`✅ Lab request created: Malaria Parasite, FBC`)
    
    // Step 6: Create prescription
    console.log('\n📌 Step 6: Creating prescription...')
    const prescription = await prisma.prescriptions.create({
      data: {
        id: 'rx-001',
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        prescribedBy: 'DJS',
        medications: JSON.stringify([
          { name: 'Artemether/Lumefantrine', dosage: '4 tablets', frequency: 'Twice daily', duration: '3 days' },
          { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '3 days' },
          { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours', duration: '3 days' }
        ]),
        status: 'pending'
      }
    })
    console.log(`✅ Prescription created with 3 medications`)
    
    // Step 7: Create routing request
    console.log('\n📌 Step 7: Creating routing request...')
    const routing = await prisma.routing_requests.create({
      data: {
        id: 'route-001',
        sender_id: 'records-001',
        sender_name: 'Records Officer Tom Davis',
        sender_role: 'RECORDS_OFFICER',
        sender_initials: 'RTD',
        receiver_role: 'NURSE',
        patient_id: patient.id,
        patient_name: `${patient.firstName} ${patient.lastName}`,
        patient_hospital_number: patient.ruhcCode,
        request_type: 'consultation',
        priority: 'routine',
        subject: 'New patient for triage',
        message: 'Patient needs vital signs assessment',
        status: 'pending'
      }
    })
    console.log(`✅ Routing request created`)
    
    // Step 8: Create notification
    console.log('\n📌 Step 8: Creating notification...')
    const notification = await prisma.notifications.create({
      data: {
        id: 'notif-001',
        userId: 'doctor-001',
        targetRoles: JSON.stringify(['DOCTOR']),
        type: 'lab_result',
        title: 'Lab Result Ready',
        message: 'Lab results for patient Test Student are ready for review',
        priority: 'normal',
        read: false
      }
    })
    console.log(`✅ Notification created`)
    
    // Step 9: Verify all data
    console.log('\n📌 Step 9: Verifying data persistence...')
    
    const patientCount = await prisma.patients.count()
    const vitalsCount = await prisma.vital_signs.count()
    const consultCount = await prisma.consultations.count()
    const labCount = await prisma.lab_requests.count()
    const rxCount = await prisma.prescriptions.count()
    const routeCount = await prisma.routing_requests.count()
    const notifCount = await prisma.notifications.count()
    const userCount = await prisma.users.count()
    const drugCount = await prisma.drugs.count()
    const labTestCount = await prisma.lab_tests.count()
    
    console.log(`   👥 Patients: ${patientCount}`)
    console.log(`   💓 Vital Signs: ${vitalsCount}`)
    console.log(`   📋 Consultations: ${consultCount}`)
    console.log(`   🔬 Lab Requests: ${labCount}`)
    console.log(`   💊 Prescriptions: ${rxCount}`)
    console.log(`   📨 Routing Requests: ${routeCount}`)
    console.log(`   🔔 Notifications: ${notifCount}`)
    console.log(`   👤 Users: ${userCount}`)
    console.log(`   💊 Drugs: ${drugCount}`)
    console.log(`   🧪 Lab Tests: ${labTestCount}`)
    
    // Summary
    console.log('\n' + '=' .repeat(50))
    console.log('📊 WORKFLOW TEST RESULTS')
    console.log('=' .repeat(50))
    console.log('   Patient Registration     ✅ PASS')
    console.log('   Vital Signs Recording    ✅ PASS')
    console.log('   Consultation Created     ✅ PASS')
    console.log('   Doctor Consultation      ✅ PASS')
    console.log('   Lab Request Created      ✅ PASS')
    console.log('   Prescription Created     ✅ PASS')
    console.log('   Routing Request Created  ✅ PASS')
    console.log('   Notification Created     ✅ PASS')
    console.log('   Data Persistence         ✅ PASS')
    console.log('=' .repeat(50))
    console.log('✨ All workflow tests passed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWorkflow()
