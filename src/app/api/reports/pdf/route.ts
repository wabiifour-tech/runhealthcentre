import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// RUN Health Centre Header for PDFs
function addHeader(doc: jsPDF, title: string) {
  // Logo placeholder - could add actual logo
  doc.setFillColor(30, 64, 175) // Blue header
  doc.rect(0, 0, 210, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RUN HEALTH CENTRE', 105, 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Redeemer\'s University, Ede, Osun State, Nigeria', 105, 18, { align: 'center' })
  doc.text('Tel: +234 XXX XXX XXX | Email: runhealthcentre@run.edu.ng', 105, 24, { align: 'center' })
  
  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(title, 105, 45, { align: 'center' })
  
  doc.setDrawColor(30, 64, 175)
  doc.line(20, 50, 190, 50)
}

function addFooter(doc: jsPDF, page: number) {
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Page ${page} of ${pageCount}`, 105, 285, { align: 'center' })
  doc.text(`Generated on: ${new Date().toLocaleString()} | RUHC Hospital Management System`, 105, 290, { align: 'center' })
}

// Generate Patient Report PDF
function generatePatientReport(patient: any, vitals: any[], consultations: any[]) {
  const doc = new jsPDF()
  
  addHeader(doc, 'PATIENT MEDICAL RECORD')
  
  let yPos = 60
  
  // Patient Information Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('PATIENT INFORMATION', 20, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  
  const patientInfo = [
    ['Hospital Number:', patient.ruhcCode || 'N/A'],
    ['Full Name:', `${patient.title || ''} ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`],
    ['Date of Birth:', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'],
    ['Gender:', patient.gender || 'N/A'],
    ['Blood Group:', patient.bloodGroup || 'Unknown'],
    ['Genotype:', patient.genotype || 'Unknown'],
    ['Phone:', patient.phone || 'N/A'],
    ['Email:', patient.email || 'N/A'],
    ['Address:', patient.address || 'N/A'],
    ['Next of Kin:', patient.nokName || 'N/A'],
    ['NOK Phone:', patient.nokPhone || 'N/A'],
    ['Allergies:', patient.allergies || 'None documented'],
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: patientInfo,
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 130 }
    }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 15
  
  // Vitals History
  if (vitals && vitals.length > 0) {
    doc.addPage()
    addHeader(doc, 'VITAL SIGNS HISTORY')
    yPos = 60
    
    const vitalsData = vitals.slice(0, 20).map((v: any) => [
      new Date(v.recordedAt).toLocaleDateString(),
      `${v.bloodPressureSystolic || '-'}/${v.bloodPressureDiastolic || '-'}`,
      v.temperature ? `${v.temperature}°C` : '-',
      v.pulse ? `${v.pulse} bpm` : '-',
      v.weight ? `${v.weight} kg` : '-',
      v.oxygenSaturation ? `${v.oxygenSaturation}%` : '-',
      v.nurseInitials || '-'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'BP (mmHg)', 'Temp', 'Pulse', 'Weight', 'SpO2', 'By']],
      body: vitalsData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8 }
    })
  }
  
  // Consultations History
  if (consultations && consultations.length > 0) {
    doc.addPage()
    addHeader(doc, 'CONSULTATION HISTORY')
    yPos = 60
    
    consultations.slice(0, 10).forEach((c: any, index: number) => {
      if (yPos > 250) {
        doc.addPage()
        addHeader(doc, 'CONSULTATION HISTORY (Continued)')
        yPos = 60
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 64, 175)
      doc.text(`Consultation ${index + 1} - ${new Date(c.createdAt).toLocaleDateString()}`, 20, yPos)
      yPos += 6
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      
      if (c.chiefComplaint) {
        doc.text(`Chief Complaint: ${c.chiefComplaint}`, 20, yPos)
        yPos += 5
      }
      if (c.provisionalDiagnosis) {
        doc.text(`Provisional Diagnosis: ${c.provisionalDiagnosis}`, 20, yPos)
        yPos += 5
      }
      if (c.finalDiagnosis) {
        doc.text(`Final Diagnosis: ${c.finalDiagnosis}`, 20, yPos)
        yPos += 5
      }
      if (c.treatmentPlan) {
        doc.text(`Treatment Plan: ${c.treatmentPlan}`, 20, yPos)
        yPos += 5
      }
      if (c.doctorInitials) {
        doc.text(`Doctor: ${c.doctorInitials}`, 20, yPos)
        yPos += 5
      }
      
      yPos += 10
    })
  }
  
  // Add footers to all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }
  
  return doc
}

// Generate Prescription PDF
function generatePrescription(patient: any, prescription: any, drugs: any[]) {
  const doc = new jsPDF()
  
  addHeader(doc, 'PRESCRIPTION')
  
  let yPos = 60
  
  // Patient Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`${patient.firstName} ${patient.lastName}`, 45, yPos)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Date:', 130, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(prescription.createdAt).toLocaleDateString(), 145, yPos)
  yPos += 6
  
  doc.setFont('helvetica', 'bold')
  doc.text('Hospital No:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(patient.ruhcCode || 'N/A', 50, yPos)
  yPos += 15
  
  // Prescription Table
  const drugData = drugs.map((d: any) => [
    d.drugName,
    d.dosage,
    d.frequency,
    d.duration,
    d.instructions || 'As directed'
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: [['Drug Name', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
    body: drugData,
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 20
  
  // Signature
  doc.setFont('helvetica', 'bold')
  doc.text('Prescriber:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(prescription.doctorInitials || 'N/A', 50, yPos)
  
  yPos += 10
  doc.setDrawColor(0, 0, 0)
  doc.line(20, yPos, 80, yPos)
  doc.setFontSize(8)
  doc.text('Signature / Stamp', 50, yPos + 5)
  
  addFooter(doc, 1)
  
  return doc
}

// Generate Lab Report PDF
function generateLabReport(patient: any, labResult: any) {
  const doc = new jsPDF()
  
  addHeader(doc, 'LABORATORY REPORT')
  
  let yPos = 60
  
  // Patient Info
  const patientInfo = [
    ['Patient Name:', `${patient.firstName} ${patient.lastName}`],
    ['Hospital Number:', patient.ruhcCode || 'N/A'],
    ['Test Date:', labResult.createdAt ? new Date(labResult.createdAt).toLocaleDateString() : 'N/A'],
  ]
  
  autoTable(doc, {
    startY: yPos,
    body: patientInfo,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 }
    }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 15
  
  // Test Results
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('TEST RESULTS', 20, yPos)
  yPos += 10
  
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const resultInfo = [
    ['Test Name:', labResult.testName || 'N/A'],
    ['Result:', labResult.result || 'N/A'],
    ['Unit:', labResult.unit || '-'],
    ['Reference Range:', labResult.referenceRange || '-'],
    ['Status:', labResult.isAbnormal ? 'ABNORMAL' : 'Normal'],
    ['Technician:', labResult.technicianInitials || 'N/A'],
  ]
  
  autoTable(doc, {
    startY: yPos,
    body: resultInfo,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 }
    }
  })
  
  if (labResult.notes) {
    yPos = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(labResult.notes, 20, yPos + 6)
  }
  
  addFooter(doc, 1)
  
  return doc
}

// Generate Daily Summary Report
function generateDailySummary(data: any) {
  const doc = new jsPDF()
  
  addHeader(doc, 'DAILY ACTIVITY SUMMARY')
  
  let yPos = 60
  
  const summaryData = [
    ['Total Patients Today:', data.patientsToday?.toString() || '0'],
    ['New Registrations:', data.newRegistrations?.toString() || '0'],
    ['Appointments:', data.appointments?.toString() || '0'],
    ['Vitals Recorded:', data.vitalsRecorded?.toString() || '0'],
    ['Consultations:', data.consultations?.toString() || '0'],
    ['Drugs Dispensed:', data.drugsDispensed?.toString() || '0'],
    ['Lab Tests:', data.labTests?.toString() || '0'],
    ['Revenue:', `₦${data.revenue?.toLocaleString() || '0'}`],
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Count']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  })
  
  addFooter(doc, 1)
  
  return doc
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body
    
    let doc: jsPDF
    
    switch (type) {
      case 'patient':
        doc = generatePatientReport(data.patient, data.vitals || [], data.consultations || [])
        break
      case 'prescription':
        doc = generatePrescription(data.patient, data.prescription, data.drugs || [])
        break
      case 'lab':
        doc = generateLabReport(data.patient, data.labResult)
        break
      case 'daily-summary':
        doc = generateDailySummary(data)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
    
    // Convert to base64
    const pdfBase64 = doc.output('datauristring')
    
    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `${type}_report_${Date.now()}.pdf`
    })
    
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    }, { status: 500 })
  }
}
