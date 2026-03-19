import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// CSV Parser function
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n')
  const result: string[][] = []
  
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false
  
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else {
        currentCell += char
      }
    }
    currentRow.push(currentCell.trim())
    currentCell = ''
    
    if (currentRow.some(cell => cell !== '')) {
      result.push(currentRow)
    }
    currentRow = []
  }
  
  return result
}

// Generate RUHC Code
function generateRUHCCode(count: number): string {
  return `RUHC-${String(count).padStart(6, '0')}`
}

// Generate Hospital Number
function generateHospitalNumber(count: number): string {
  const year = new Date().getFullYear()
  return `RUN/${year}/${String(count).padStart(4, '0')}`
}

// Normalize patient type
function normalizePatientType(type: string | undefined): string {
  if (!type) return 'Outsider'
  
  const typeMap: Record<string, string> = {
    'student': 'Student',
    'academic staff': 'Academic Staff',
    'academic': 'Academic Staff',
    'staff academic': 'Academic Staff',
    'non-academic staff': 'Non-Academic Staff',
    'non academic staff': 'Non-Academic Staff',
    'non-academic': 'Non-Academic Staff',
    'staff non-academic': 'Non-Academic Staff',
    'outsider': 'Outsider',
    'external': 'Outsider',
    'visitor': 'Outsider',
  }
  
  return typeMap[type.toLowerCase().trim()] || 'Outsider'
}

// POST - Import patients from CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dryRun = formData.get('dryRun') === 'true'
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }
    
    // Read file content
    const fileText = await file.text()
    const rows = parseCSV(fileText)
    
    if (rows.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must have at least a header row and one data row' 
      }, { status: 400 })
    }
    
    // Get headers from first row
    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const dataRows = rows.slice(1)
    
    // Map column indices
    const colMap: Record<string, number> = {}
    const columnMappings: Record<string, string[]> = {
      firstName: ['firstname', 'first_name', 'fname', 'givenname'],
      lastName: ['lastname', 'last_name', 'lname', 'surname', 'familyname'],
      middleName: ['middlename', 'middle_name', 'mname'],
      matricNumber: ['matricnumber', 'matric_number', 'matricno', 'matric', 'studentid', 'student_id', 'staffid', 'staff_id', 'idnumber', 'id_number', 'employeenumber', 'employee_number'],
      patientType: ['patienttype', 'patient_type', 'category', 'type', 'classification'],
      dateOfBirth: ['dateofbirth', 'date_of_birth', 'dob', 'birthdate', 'birth_date'],
      gender: ['gender', 'sex'],
      phone: ['phone', 'telephone', 'mobile', 'phonenumber', 'phone_number', 'cell'],
      email: ['email', 'emailaddress', 'email_address'],
      address: ['address', 'street', 'streetaddress'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      lga: ['lga', 'localgovernment', 'local_government'],
      nationality: ['nationality', 'country'],
      bloodGroup: ['bloodgroup', 'blood_group', 'bloodgroup', 'bg'],
      genotype: ['genotype', 'genotype'],
      religion: ['religion', 'faith'],
      maritalStatus: ['maritalstatus', 'marital_status', 'status'],
      nokName: ['nokname', 'nok_name', 'nextofkinname', 'next_of_kin_name'],
      nokRelationship: ['nokrelationship', 'nok_relationship', 'nextofkinrelationship'],
      nokPhone: ['nokphone', 'nok_phone', 'nextofkinphone'],
      nokAddress: ['nokaddress', 'nok_address', 'nextofkinaddress'],
      emergencyContactName: ['emergencycontactname', 'emergency_contact_name', 'emergencyname'],
      emergencyContactPhone: ['emergencycontactphone', 'emergency_contact_phone', 'emergencyphone'],
      allergies: ['allergies', 'allergy'],
      chronicConditions: ['chronicconditions', 'chronic_conditions', 'medicalconditions'],
    }
    
    // Find column indices
    for (const [field, aliases] of Object.entries(columnMappings)) {
      for (let i = 0; i < headers.length; i++) {
        if (aliases.includes(headers[i])) {
          colMap[field] = i
          break
        }
      }
    }
    
    // Get current patient count for ID generation
    const existingCount = await prisma.patients.count()
    
    const results = {
      total: dataRows.length,
      successCount: 0,
      errorCount: 0,
      errors: [] as { row: number; error: string; data?: any }[],
      imported: [] as any[],
      dryRun: dryRun,
    }
    
    let newPatientCount = existingCount + 1
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNum = i + 2 // +2 because row 1 is header
      
      try {
        // Extract values using column mapping
        const getValue = (field: string): string | undefined => {
          const idx = colMap[field]
          return idx !== undefined ? row[idx] : undefined
        }
        
        const firstName = getValue('firstName')
        const lastName = getValue('lastName')
        
        // Validate required fields
        if (!firstName || !lastName) {
          results.errors.push({
            row: rowNum,
            error: 'First Name and Last Name are required',
            data: { firstName, lastName }
          })
          results.errorCount++
          continue
        }
        
        // Build patient object
        const patientType = normalizePatientType(getValue('patientType'))
        const matricNumber = getValue('matricNumber')
        
        // Validate Matric Number for Students/Staff
        if ((patientType === 'Student' || patientType === 'Academic Staff' || patientType === 'Non-Academic Staff') && !matricNumber) {
          results.errors.push({
            row: rowNum,
            error: `${patientType} requires Matric/Staff Number`,
            data: { firstName, lastName, patientType }
          })
          results.errorCount++
          continue
        }
        
        // Check for duplicate by matric number
        if (matricNumber) {
          const existing = await prisma.patients.findFirst({
            where: { matricNumber: matricNumber.trim() }
          })
          if (existing) {
            results.errors.push({
              row: rowNum,
              error: `Patient with Matric/Staff Number "${matricNumber}" already exists`,
              data: { firstName, lastName, matricNumber }
            })
            results.errorCount++
            continue
          }
        }
        
        const patientId = uuidv4()
        const patientData = {
          id: patientId,
          hospitalNumber: generateHospitalNumber(newPatientCount),
          ruhcCode: generateRUHCCode(newPatientCount),
          matricNumber: matricNumber?.trim() || null,
          patientType: patientType,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: getValue('middleName')?.trim() || null,
          dateOfBirth: getValue('dateOfBirth')?.trim() || null,
          gender: getValue('gender')?.trim() || 'Male',
          phone: getValue('phone')?.trim() || null,
          email: getValue('email')?.trim() || null,
          address: getValue('address')?.trim() || null,
          city: getValue('city')?.trim() || null,
          state: getValue('state')?.trim() || null,
          lga: getValue('lga')?.trim() || null,
          nationality: getValue('nationality')?.trim() || 'Nigerian',
          bloodGroup: getValue('bloodGroup')?.trim() || null,
          genotype: getValue('genotype')?.trim() || null,
          religion: getValue('religion')?.trim() || null,
          maritalStatus: getValue('maritalStatus')?.trim() || null,
          nokName: getValue('nokName')?.trim() || null,
          nokRelationship: getValue('nokRelationship')?.trim() || null,
          nokPhone: getValue('nokPhone')?.trim() || null,
          nokAddress: getValue('nokAddress')?.trim() || null,
          emergencyContactName: getValue('emergencyContactName')?.trim() || null,
          emergencyContactPhone: getValue('emergencyContactPhone')?.trim() || null,
          allergies: getValue('allergies')?.trim() || null,
          chronicConditions: getValue('chronicConditions')?.trim() || null,
          isActive: true,
          registeredAt: new Date(),
        }
        
        if (!dryRun) {
          // Save to database
          await prisma.patients.create({ data: patientData })
        }
        
        results.imported.push({
          ruhcCode: patientData.ruhcCode,
          hospitalNumber: patientData.hospitalNumber,
          name: `${patientData.firstName} ${patientData.lastName}`,
          matricNumber: patientData.matricNumber,
          patientType: patientData.patientType,
        })
        
        results.successCount++
        newPatientCount++
        
      } catch (error: any) {
        results.errors.push({
          row: rowNum,
          error: error.message || 'Unknown error',
        })
        results.errorCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
    })
    
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to import patients' 
    }, { status: 500 })
  }
}

// GET - Get import template
export async function GET() {
  const template = `firstName,lastName,middleName,matricNumber,patientType,dateOfBirth,gender,phone,email,address,city,state,lga,nationality,bloodGroup,genotype,religion,maritalStatus,nokName,nokRelationship,nokPhone,nokAddress,emergencyContactName,emergencyContactPhone,allergies,chronicConditions
John,Ade,Michael,RU/2020/123,Student,1998-05-15,Male,08012345678,john.ade@run.edu.ng,123 University Road,Ede,Osun,Ede North,Nigerian,O,AA,Christian,Single,Mary Ade,Mother,08087654321,456 Home Street,Mary Ade,08087654321,Penicillin,None
Jane,Okafor,,RUN/STAFF/001,Academic Staff,1985-08-20,Female,08098765432,jane.okafor@run.edu.ng,789 Staff Quarters,Ede,Osun,Ede South,Nigerian,A,AS,Christian,Married,James Okafor,Husband,08011111111,321 Family Home,James Okafor,08011111111,None,Hypertension
Grace,Eze,,,Outsider,1990-03-10,Female,08055555555,grace@gmail.com,456 Market Street,Lagos,Lagos,Ikeja,Nigerian,B,SS,Christian,Single,Emeka Eze,Brother,08022222222,789 Village,Emeka Eze,08022222222,None,Asthma`

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="patient_import_template.csv"',
    },
  })
}
