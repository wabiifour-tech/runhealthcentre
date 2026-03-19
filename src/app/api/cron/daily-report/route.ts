// Cron API for automatic daily report generation
// Called by Vercel Cron at 11:59 PM daily

import { NextRequest, NextResponse } from 'next/server'
import { sql, sqlOne, sqlExec } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Verify cron authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'ruhc-cron-2026'
  
  // Check for Vercel Cron header or our secret
  return authHeader === `Bearer ${cronSecret}` || 
         request.headers.get('x-vercel-cron') === 'true'
}

// Types for daily records
interface DailyPatientRecord {
  id: string
  hospitalNumber: string
  ruhcCode: string
  matricNumber: string | null
  patientType: string | null
  fullName: string
  gender: string
  dateOfBirth: string | null
  phone: string | null
  admissionStatus: 'Outpatient' | 'Inpatient'
  wardName: string | null
  bedNumber: number | null
  admissionDate: string | null
  dischargeDate: string | null
  chiefComplaint: string | null
  diagnosis: string | null
  registeredAt: string
  consultationTime: string | null
  doctorName: string | null
}

// Get patient type display name
function getPatientTypeDisplay(type: string | null): string {
  switch (type) {
    case 'Student': return 'Student'
    case 'Academic Staff': return 'Academic Staff'
    case 'Non-Academic Staff': return 'Non-Academic Staff'
    case 'Outsider': return 'External'
    default: return 'N/A'
  }
}

// Add RUHC header to PDF
function addHeader(doc: jsPDF, title: string, date: string) {
  // Blue header banner
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text("REDEEMER'S UNIVERSITY HEALTH CENTRE", 105, 10, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('RUN Health Centre | Ede, Osun State | Tel: +234 XXX XXX XXX', 105, 17, { align: 'center' })
  
  // Title below header
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 105, 40, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${date}`, 105, 48, { align: 'center' })
  
  doc.setDrawColor(30, 64, 175)
  doc.line(20, 52, 190, 52)
}

// Add footer to PDF
function addFooter(doc: jsPDF, page: number, totalPages: number, generatedAt: string) {
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Page ${page} of ${totalPages}`, 105, 285, { align: 'center' })
  doc.text(`RUN Health Centre | Auto-generated: ${generatedAt} | RUHC-2026`, 105, 290, { align: 'center' })
}

// Generate the Daily Records PDF
function generateDailyRecordsPDF(records: DailyPatientRecord[], reportDate: string): jsPDF {
  const doc = new jsPDF()
  
  addHeader(doc, 'DAILY PATIENT RECORDS REPORT', reportDate)
  
  let yPos = 58
  
  // Summary Statistics
  const totalPatients = records.length
  const students = records.filter(r => r.patientType === 'Student').length
  const academicStaff = records.filter(r => r.patientType === 'Academic Staff').length
  const nonAcademicStaff = records.filter(r => r.patientType === 'Non-Academic Staff').length
  const outsiders = records.filter(r => r.patientType === 'Outsider').length
  const inpatients = records.filter(r => r.admissionStatus === 'Inpatient').length
  const outpatients = records.filter(r => r.admissionStatus === 'Outpatient').length
  
  // Summary box
  doc.setFillColor(240, 248, 255)
  doc.rect(15, yPos, 180, 35, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('DAILY SUMMARY', 20, yPos + 8)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  
  yPos += 14
  doc.text(`Total Patients: ${totalPatients}`, 20, yPos)
  doc.text(`Students: ${students}`, 70, yPos)
  doc.text(`Academic Staff: ${academicStaff}`, 120, yPos)
  
  yPos += 6
  doc.text(`Non-Academic Staff: ${nonAcademicStaff}`, 20, yPos)
  doc.text(`External: ${outsiders}`, 80, yPos)
  doc.text(`Outpatients: ${outpatients}`, 130, yPos)
  
  yPos += 6
  doc.text(`Inpatients (Admitted): ${inpatients}`, 20, yPos)
  
  yPos += 20
  
  // Patient Records Table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('PATIENT DETAILS', 20, yPos)
  yPos += 5
  
  // Prepare table data
  const tableData = records.map((r, index) => [
    (index + 1).toString(),
    r.hospitalNumber || r.ruhcCode,
    r.fullName,
    r.matricNumber || '-',
    getPatientTypeDisplay(r.patientType),
    r.admissionStatus,
    r.wardName || '-',
    r.chiefComplaint?.substring(0, 25) || '-'
  ])
  
  // If no records, add placeholder
  if (tableData.length === 0) {
    tableData.push(['-', 'No records', 'for this', 'date', '-', '-', '-', '-'])
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['S/N', 'Hospital No.', 'Patient Name', 'Matric/Staff ID', 'Category', 'Status', 'Ward', 'Chief Complaint']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 36 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  })
  
  // Add footers to all pages
  const totalPages = doc.getNumberOfPages()
  const generatedAt = new Date().toLocaleString()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages, generatedAt)
  }
  
  return doc
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get yesterday's date (since this runs at 11:59 PM for today's complete records)
    const today = new Date()
    const reportDate = today.toISOString().split('T')[0]
    
    console.log(`[CRON] Starting daily report generation for ${reportDate}`)
    
    // Fetch all patient records for today
    const records = await sql(`
      SELECT 
        p.id,
        p."hospitalNumber",
        p."ruhcCode",
        p."matricNumber",
        p."patientType",
        CONCAT(COALESCE(p.title || ' ', ''), p."firstName", ' ', COALESCE(p."middleName" || ' ', ''), p."lastName") as "fullName",
        p.gender,
        p."dateOfBirth",
        p.phone,
        CASE 
          WHEN a.id IS NOT NULL AND a.status = 'admitted' THEN 'Inpatient'
          ELSE 'Outpatient'
        END as "admissionStatus",
        a."unit" as "wardName",
        a."bedNumber",
        a."admittedAt" as "admissionDate",
        a."dischargedAt" as "dischargeDate",
        c."chiefComplaint",
        c."finalDiagnosis" as diagnosis,
        p."registeredAt",
        c."createdAt" as "consultationTime",
        c."doctorName"
      FROM patients p
      LEFT JOIN consultations c ON c."patientId" = p.id 
        AND DATE(c."createdAt") = $1
      LEFT JOIN admissions a ON a."patientId" = p.id 
        AND DATE(a."admittedAt") <= $1
        AND (a."dischargedAt" IS NULL OR DATE(a."dischargedAt") >= $1)
      WHERE 
        DATE(p."registeredAt") = $1
        OR DATE(c."createdAt") = $1
        OR (a.id IS NOT NULL AND DATE(a."admittedAt") <= $1 
            AND (a."dischargedAt" IS NULL OR DATE(a."dischargedAt") >= $1))
      ORDER BY p."registeredAt" DESC
    `, [reportDate]) as DailyPatientRecord[]
    
    // Generate PDF
    const doc = generateDailyRecordsPDF(records, reportDate)
    const pdfBase64 = doc.output('datauristring')
    const filename = `RUHC_Daily_Records_${reportDate}.pdf`
    
    // Ensure table exists
    try {
      await sqlExec(`
        CREATE TABLE IF NOT EXISTS daily_reports (
          id VARCHAR(100) PRIMARY KEY,
          report_date DATE NOT NULL UNIQUE,
          filename VARCHAR(255) NOT NULL,
          total_patients INTEGER DEFAULT 0,
          generated_at TIMESTAMP DEFAULT NOW(),
          pdf_data TEXT,
          metadata JSONB
        )
      `)
    } catch (e) {
      console.log('Table might already exist')
    }
    
    // Store the report
    const reportId = `rpt_${Date.now()}`
    
    await sqlExec(`
      INSERT INTO daily_reports (id, report_date, filename, total_patients, generated_at, pdf_data, metadata)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6)
      ON CONFLICT (report_date) 
      DO UPDATE SET 
        filename = EXCLUDED.filename,
        total_patients = EXCLUDED.total_patients,
        generated_at = NOW(),
        pdf_data = EXCLUDED.pdf_data,
        metadata = EXCLUDED.metadata
    `, [
      reportId,
      reportDate,
      filename,
      records.length,
      pdfBase64,
      JSON.stringify({
        students: records.filter((r: DailyPatientRecord) => r.patientType === 'Student').length,
        academicStaff: records.filter((r: DailyPatientRecord) => r.patientType === 'Academic Staff').length,
        nonAcademicStaff: records.filter((r: DailyPatientRecord) => r.patientType === 'Non-Academic Staff').length,
        outsiders: records.filter((r: DailyPatientRecord) => r.patientType === 'Outsider').length,
        inpatients: records.filter((r: DailyPatientRecord) => r.admissionStatus === 'Inpatient').length,
        outpatients: records.filter((r: DailyPatientRecord) => r.admissionStatus === 'Outpatient').length,
        autoGenerated: true
      })
    ])
    
    console.log(`[CRON] Daily report generated successfully for ${reportDate}`)
    console.log(`[CRON] Total patients: ${records.length}`)
    
    return NextResponse.json({
      success: true,
      message: `Daily report generated for ${reportDate}`,
      report: {
        id: reportId,
        date: reportDate,
        filename,
        totalPatients: records.length,
        downloadUrl: `/api/reports/daily-records?date=${reportDate}&download=true`
      }
    })
    
  } catch (error: any) {
    console.error('[CRON] Daily report generation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
