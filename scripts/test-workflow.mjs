// Comprehensive HMS Workflow Test
// Tests the complete patient journey from registration to discharge

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'
const PASSWORD = 'Test@123'

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
}

function log(test, status, details) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} ${test}`)
  if (status === 'PASS') results.passed.push(test)
  else if (status === 'FAIL') results.failed.push({ test, error: details?.message || 'Unknown error', details })
  else results.warnings.push({ test, message: details?.message || '' })
  
  if (details && status !== 'PASS') {
    const detailStr = typeof details === 'object' ? JSON.stringify(details).substring(0, 200) : String(details)
    console.log('   Details:', detailStr)
  }
}

// Helper function for API calls
async function apiCall(endpoint, method, body) {
  const headers = { 'Content-Type': 'application/json' }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  
  const data = await response.json()
  return { status: response.status, data }
}

// Login helper
async function login(email) {
  const { data, status } = await apiCall('/api/auth/login', 'POST', { 
    email, 
    password: PASSWORD 
  })
  if (status !== 200 || !data.success) {
    throw new Error(`Login failed for ${email}: ${data.error || 'Unknown error'}`)
  }
  return data
}

// Test users
const users = {
  superadmin: 'superadmin@ruhc',
  admin: 'admin@ruhc',
  doctor: 'doctor@ruhc',
  nurse: 'nurse@ruhc',
  pharmacist: 'pharmacist@ruhc',
  labtech: 'labtech@ruhc',
  matron: 'matron@ruhc',
  records: 'records@ruhc'
}

// Store session data
const sessions = {}
let patientId = ''
let consultationId = ''
let labRequestId = ''
let prescriptionId = ''

async function runTests() {
  console.log('\n' + '='.repeat(60))
  console.log('🏥 RUHC HMS COMPREHENSIVE WORKFLOW TEST')
  console.log('='.repeat(60) + '\n')

  // ============================================
  // PHASE 1: AUTHENTICATION TESTS
  // ============================================
  console.log('\n📋 PHASE 1: AUTHENTICATION TESTS')
  console.log('-'.repeat(40))

  for (const [role, email] of Object.entries(users)) {
    try {
      const result = await login(email)
      sessions[role] = result
      log(`Login ${role} (${email})`, 'PASS')
    } catch (e) {
      log(`Login ${role} (${email})`, 'FAIL', { message: e.message })
    }
  }

  // ============================================
  // PHASE 2: SUPER ADMIN TESTS
  // ============================================
  console.log('\n📋 PHASE 2: SUPER ADMIN TESTS')
  console.log('-'.repeat(40))

  // Get all users
  try {
    const { data, status } = await apiCall('/api/auth/login', 'PUT')
    if (status === 200 && data.success && data.users?.length >= 8) {
      log('SuperAdmin: View all users', 'PASS')
      console.log(`   Found ${data.users.length} users`)
    } else {
      log('SuperAdmin: View all users', 'FAIL', { message: `Expected 8+ users, got ${data.users?.length || 0}` })
    }
  } catch (e) {
    log('SuperAdmin: View all users', 'FAIL', { message: e.message })
  }

  // Test navigation items (check API endpoints)
  const navEndpoints = [
    '/api/patients',
    '/api/consultations',
    '/api/prescriptions',
    '/api/lab-requests',
    '/api/vitals',
    '/api/drugs',
    '/api/audit'
  ]

  for (const endpoint of navEndpoints) {
    try {
      const { status } = await apiCall(endpoint, 'GET')
      if (status === 200 || status === 201) {
        log(`API ${endpoint}`, 'PASS')
      } else {
        log(`API ${endpoint}`, 'WARN', { message: `Status ${status}` })
      }
    } catch (e) {
      log(`API ${endpoint}`, 'FAIL', { message: e.message })
    }
  }

  // ============================================
  // PHASE 3: RECORDS OFFICER - PATIENT REGISTRATION
  // ============================================
  console.log('\n📋 PHASE 3: RECORDS OFFICER - PATIENT REGISTRATION')
  console.log('-'.repeat(40))

  const patientData = {
    firstName: 'John',
    lastName: 'Testpatient',
    middleName: 'Middle',
    gender: 'Male',
    dateOfBirth: '1995-05-15',
    phone: '08012345678',
    email: 'john.testpatient@university.edu',
    patientType: 'Student',
    matricNumber: 'RUN/2024/001',
    address: '123 University Road',
    city: 'Ede',
    state: 'Osun',
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: 'None',
    nokName: 'Mrs. Testpatient',
    nokRelationship: 'Mother',
    nokPhone: '08098765432',
    emergencyContactName: 'Mr. Emergency',
    emergencyContactPhone: '08011112222',
    registeredBy: sessions.records?.user?.id || 'records-id'
  }

  try {
    const { data, status } = await apiCall('/api/patients', 'POST', patientData)
    if (status === 200 || status === 201) {
      patientId = data.patient?.id || data.id
      log('Records: Register new patient', 'PASS')
      console.log(`   Patient ID: ${patientId}`)
      console.log(`   RUHC Code: ${data.patient?.ruhcCode || data.ruhcCode || 'N/A'}`)
    } else {
      log('Records: Register new patient', 'FAIL', { message: data.error || 'Unknown error', data })
    }
  } catch (e) {
    log('Records: Register new patient', 'FAIL', { message: e.message })
  }

  // Get patients list
  try {
    const { data, status } = await apiCall('/api/patients', 'GET')
    if (status === 200 && data.patients?.length > 0) {
      log('Records: View patients list', 'PASS')
      console.log(`   Found ${data.patients.length} patients`)
    } else {
      log('Records: View patients list', 'WARN', { message: 'No patients found' })
    }
  } catch (e) {
    log('Records: View patients list', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 4: SEND TO NURSE
  // ============================================
  console.log('\n📋 PHASE 4: RECORDS → NURSE ROUTING')
  console.log('-'.repeat(40))

  try {
    const { data, status } = await apiCall('/api/routing', 'POST', {
      sender_id: sessions.records?.user?.id,
      sender_name: sessions.records?.user?.name,
      sender_role: 'RECORDS_OFFICER',
      receiver_role: 'NURSE',
      patient_id: patientId,
      patient_name: 'John Testpatient',
      request_type: 'VITALS_CHECK',
      priority: 'routine',
      subject: 'New patient needs vitals',
      message: 'Please take vital signs for new patient registration'
    })
    
    if (status === 200 || status === 201) {
      log('Records: Send patient to Nurse', 'PASS')
    } else {
      log('Records: Send patient to Nurse', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Records: Send patient to Nurse', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 5: NURSE - VITAL SIGNS
  // ============================================
  console.log('\n📋 PHASE 5: NURSE - VITAL SIGNS')
  console.log('-'.repeat(40))

  const vitalsData = {
    patientId: patientId,
    bloodPressureSystolic: '120',
    bloodPressureDiastolic: '80',
    temperature: '36.8',
    pulse: '72',
    respiratoryRate: '16',
    weight: '70',
    height: '175',
    oxygenSaturation: '98',
    painScore: '0',
    notes: 'Patient appears healthy, no complaints',
    recordedBy: sessions.nurse?.user?.id
  }

  try {
    const { data, status } = await apiCall('/api/vitals', 'POST', vitalsData)
    if (status === 200 || status === 201) {
      log('Nurse: Record vital signs', 'PASS')
    } else {
      log('Nurse: Record vital signs', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Nurse: Record vital signs', 'FAIL', { message: e.message })
  }

  // Nurse sends to Doctor
  try {
    const { data, status } = await apiCall('/api/routing', 'POST', {
      sender_id: sessions.nurse?.user?.id,
      sender_name: sessions.nurse?.user?.name,
      sender_role: 'NURSE',
      receiver_role: 'DOCTOR',
      patient_id: patientId,
      patient_name: 'John Testpatient',
      request_type: 'CONSULTATION',
      priority: 'routine',
      subject: 'Patient ready for consultation',
      message: 'Vitals recorded. Patient has malaria symptoms. Ready for doctor review.'
    })
    
    if (status === 200 || status === 201) {
      log('Nurse: Send to Doctor', 'PASS')
    } else {
      log('Nurse: Send to Doctor', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Nurse: Send to Doctor', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 6: DOCTOR - CONSULTATION
  // ============================================
  console.log('\n📋 PHASE 6: DOCTOR - CONSULTATION')
  console.log('-'.repeat(40))

  const consultationData = {
    patientId: patientId,
    patient: 'John Testpatient',
    doctorId: sessions.doctor?.user?.id,
    doctorName: sessions.doctor?.user?.name,
    status: 'in_progress',
    chiefComplaint: 'Fever, headache, body weakness for 3 days',
    historyOfPresentIllness: 'Patient reports fever that started 3 days ago',
    provisionalDiagnosis: 'Malaria (uncomplicated)',
    treatmentPlan: 'Antimalarial therapy, supportive care'
  }

  try {
    const { data, status } = await apiCall('/api/consultations', 'POST', consultationData)
    if (status === 200 || status === 201) {
      consultationId = data.consultation?.id || data.id
      log('Doctor: Create consultation', 'PASS')
      console.log(`   Consultation ID: ${consultationId}`)
    } else {
      log('Doctor: Create consultation', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Doctor: Create consultation', 'FAIL', { message: e.message })
  }

  // Doctor sends to Lab
  try {
    const { data, status } = await apiCall('/api/lab-requests', 'POST', {
      patientId: patientId,
      patient: 'John Testpatient',
      requestedBy: sessions.doctor?.user?.id,
      tests: JSON.stringify(['Malaria Parasite', 'Full Blood Count']),
      notes: 'Suspected malaria - confirm diagnosis'
    })
    
    if (status === 200 || status === 201) {
      labRequestId = data.labRequest?.id || data.id
      log('Doctor: Send to Laboratory', 'PASS')
      console.log(`   Lab Request ID: ${labRequestId}`)
    } else {
      log('Doctor: Send to Laboratory', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Doctor: Send to Laboratory', 'FAIL', { message: e.message })
  }

  // Doctor sends to Pharmacy
  try {
    const { data, status } = await apiCall('/api/prescriptions', 'POST', {
      patientId: patientId,
      patient: 'John Testpatient',
      prescribedBy: sessions.doctor?.user?.id,
      medications: JSON.stringify([
        { name: 'Artemether/Lumefantrine', dosage: '20/120mg', route: 'Oral', frequency: 'Twice daily', duration: '3 days', quantity: 12 },
        { name: 'Paracetamol', dosage: '500mg', route: 'Oral', frequency: 'As needed', duration: '3 days', quantity: 9 },
        { name: 'Vitamin C', dosage: '1000mg', route: 'Oral', frequency: 'Once daily', duration: '7 days', quantity: 7 }
      ]),
      notes: 'Take after meals. Plenty of fluids.'
    })
    
    if (status === 200 || status === 201) {
      prescriptionId = data.prescription?.id || data.id
      log('Doctor: Send to Pharmacy', 'PASS')
      console.log(`   Prescription ID: ${prescriptionId}`)
    } else {
      log('Doctor: Send to Pharmacy', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Doctor: Send to Pharmacy', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 7: LAB TECHNICIAN
  // ============================================
  console.log('\n📋 PHASE 7: LAB TECHNICIAN - PROCESS TESTS')
  console.log('-'.repeat(40))

  try {
    const { data, status } = await apiCall('/api/lab-requests', 'GET')
    if (status === 200 && data.labRequests?.length > 0) {
      log('LabTech: View pending lab requests', 'PASS')
    } else {
      log('LabTech: View pending lab requests', 'WARN', { message: 'No lab requests found' })
    }
  } catch (e) {
    log('LabTech: View pending lab requests', 'FAIL', { message: e.message })
  }

  // Submit lab results
  try {
    const { data, status } = await apiCall('/api/lab-results', 'POST', {
      requestId: labRequestId,
      patientId: patientId,
      patient: 'John Testpatient',
      testName: 'Malaria Parasite',
      result: 'POSITIVE - Plasmodium falciparum detected',
      notes: 'Confirmatory test positive',
      performedBy: sessions.labtech?.user?.id
    })
    
    if (status === 200 || status === 201) {
      log('LabTech: Submit lab results', 'PASS')
    } else {
      log('LabTech: Submit lab results', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('LabTech: Submit lab results', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 8: PHARMACIST
  // ============================================
  console.log('\n📋 PHASE 8: PHARMACIST - DISPENSE MEDICATIONS')
  console.log('-'.repeat(40))

  try {
    const { data, status } = await apiCall('/api/prescriptions', 'GET')
    if (status === 200 && data.prescriptions?.length > 0) {
      log('Pharmacist: View pending prescriptions', 'PASS')
    } else {
      log('Pharmacist: View pending prescriptions', 'WARN', { message: 'No prescriptions found' })
    }
  } catch (e) {
    log('Pharmacist: View pending prescriptions', 'FAIL', { message: e.message })
  }

  // Dispense medications
  try {
    const { data, status } = await apiCall('/api/prescriptions', 'PUT', {
      id: prescriptionId,
      status: 'dispensed',
      dispensedBy: sessions.pharmacist?.user?.id
    })
    
    if (status === 200 || status === 201) {
      log('Pharmacist: Dispense medications', 'PASS')
    } else {
      log('Pharmacist: Dispense medications', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Pharmacist: Dispense medications', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 9: DATA PERSISTENCE CHECKS
  // ============================================
  console.log('\n📋 PHASE 9: DATA PERSISTENCE CHECKS')
  console.log('-'.repeat(40))

  // Check patient exists
  try {
    const { data, status } = await apiCall(`/api/patients?id=${patientId}`, 'GET')
    if (status === 200 && (data.patient || data.patients?.find(p => p.id === patientId))) {
      log('Persistence: Patient data saved', 'PASS')
    } else {
      log('Persistence: Patient data saved', 'FAIL', { message: 'Patient not found' })
    }
  } catch (e) {
    log('Persistence: Patient data saved', 'FAIL', { message: e.message })
  }

  // Check consultation exists
  try {
    const { data, status } = await apiCall('/api/consultations', 'GET')
    if (status === 200 && data.consultations?.length > 0) {
      log('Persistence: Consultation data saved', 'PASS')
    } else {
      log('Persistence: Consultation data saved', 'FAIL', { message: 'No consultations found' })
    }
  } catch (e) {
    log('Persistence: Consultation data saved', 'FAIL', { message: e.message })
  }

  // Check prescriptions
  try {
    const { data, status } = await apiCall('/api/prescriptions', 'GET')
    if (status === 200 && data.prescriptions?.length > 0) {
      log('Persistence: Prescription data saved', 'PASS')
    } else {
      log('Persistence: Prescription data saved', 'FAIL', { message: 'No prescriptions found' })
    }
  } catch (e) {
    log('Persistence: Prescription data saved', 'FAIL', { message: e.message })
  }

  // Check lab results
  try {
    const { data, status } = await apiCall('/api/lab-results', 'GET')
    if (status === 200 && data.labResults?.length > 0) {
      log('Persistence: Lab results saved', 'PASS')
    } else {
      log('Persistence: Lab results saved', 'FAIL', { message: 'No lab results found' })
    }
  } catch (e) {
    log('Persistence: Lab results saved', 'FAIL', { message: e.message })
  }

  // Check vitals
  try {
    const { data, status } = await apiCall('/api/vitals', 'GET')
    if (status === 200 && data.vitals?.length > 0) {
      log('Persistence: Vital signs saved', 'PASS')
    } else {
      log('Persistence: Vital signs saved', 'FAIL', { message: 'No vitals found' })
    }
  } catch (e) {
    log('Persistence: Vital signs saved', 'FAIL', { message: e.message })
  }

  // Check routing requests
  try {
    const { data, status } = await apiCall('/api/routing', 'GET')
    if (status === 200 && data.requests?.length > 0) {
      log('Persistence: Routing requests saved', 'PASS')
    } else {
      log('Persistence: Routing requests saved', 'WARN', { message: 'No routing requests found' })
    }
  } catch (e) {
    log('Persistence: Routing requests saved', 'FAIL', { message: e.message })
  }

  // ============================================
  // PHASE 10: NOTIFICATION SYSTEM TEST
  // ============================================
  console.log('\n📋 PHASE 10: NOTIFICATION SYSTEM TEST')
  console.log('-'.repeat(40))

  try {
    const { data, status } = await apiCall(`/api/notifications?userId=${sessions.superadmin?.user?.id}`, 'GET')
    if (status === 200) {
      log('Notifications: Fetch notifications', 'PASS')
      console.log(`   Found ${data.notifications?.length || 0} notifications`)
    } else {
      log('Notifications: Fetch notifications', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Notifications: Fetch notifications', 'FAIL', { message: e.message })
  }

  // Test notification creation
  try {
    const { data, status } = await apiCall('/api/notifications', 'POST', {
      userId: sessions.doctor?.user?.id,
      type: 'test_notification',
      title: 'Test Notification',
      message: 'This is a test notification from the workflow test',
      priority: 'normal'
    })
    
    if (status === 200 || status === 201) {
      log('Notifications: Create notification', 'PASS')
    } else {
      log('Notifications: Create notification', 'FAIL', { message: data.error || 'Unknown error' })
    }
  } catch (e) {
    log('Notifications: Create notification', 'FAIL', { message: e.message })
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log(`⚠️  Warnings: ${results.warnings.length}`)
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.failed.forEach(f => console.log(`   - ${f.test}: ${f.error}`))
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    results.warnings.forEach(w => console.log(`   - ${w.test}: ${w.message}`))
  }

  const total = results.passed.length + results.failed.length
  const successRate = total > 0 ? Math.round((results.passed.length / total) * 100) : 0
  console.log(`\n📈 Success Rate: ${successRate}%`)
  
  return results
}

// Run tests
runTests().catch(console.error)
