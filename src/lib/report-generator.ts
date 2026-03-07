/**
 * Report Generation Utilities
 * PDF and Excel export functionality
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ImageRun, Header, Footer, PageNumber, NumberFormat } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Types
interface PatientData {
  hospitalNumber: string
  name: string
  dateOfBirth: string
  gender: string
  phone?: string
  address?: string
}

interface VitalSignData {
  date: string
  bp: string
  temp: string
  pulse: string
  weight: string
  spo2: string
}

interface MedicationData {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface DailyReportData {
  date: string
  totalPatients: number
  newRegistrations: number
  totalConsultations: number
  diagnosesBreakdown: { diagnosis: string; count: number; percentage: number }[]
  treatmentsGiven: { treatment: string; count: number }[]
  labTestsPerformed: number
  prescriptionsDispensed: number
  topDiagnoses: { name: string; count: number }[]
  staffOnDuty: { name: string; role: string }[]
}

/**
 * Generate Daily Summary Report - DOCX Format
 */
export async function generateDailySummaryDOCX(data: DailyReportData): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: [
        // Header with Logo placeholder
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "RUN HEALTH CENTRE",
              bold: true,
              size: 36,
              color: "1E40AF"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Redeemer's University, Ede, Osun State",
              size: 22
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              size: 20,
              color: "CCCCCC"
            })
          ]
        }),
        new Paragraph({ children: [] }),
        
        // Report Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "DAILY SUMMARY REPORT",
              bold: true,
              size: 32,
              color: "10B981"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Date: ${data.date}`,
              size: 24,
              italics: true
            })
          ]
        }),
        new Paragraph({ children: [] }),
        
        // Key Statistics
        new Paragraph({
          children: [new TextRun({ text: "KEY STATISTICS", bold: true, size: 28, color: "1E40AF" })]
        }),
        new Paragraph({ children: [] }),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true, color: "FFFFFF" })] })],
                  shading: { fill: "1E40AF" }
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true, color: "FFFFFF" })] })],
                  shading: { fill: "1E40AF" }
                }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Total Patients Seen")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(data.totalPatients), bold: true })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("New Registrations")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(data.newRegistrations), bold: true, color: "10B981" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Total Consultations")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(data.totalConsultations), bold: true })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Lab Tests Performed")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(data.labTestsPerformed), bold: true, color: "8B5CF6" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Prescriptions Dispensed")] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(data.prescriptionsDispensed), bold: true, color: "F59E0B" })] })] }),
              ]
            }),
          ]
        }),
        
        new Paragraph({ children: [] }),
        
        // Diagnoses Breakdown
        new Paragraph({
          children: [new TextRun({ text: "DIAGNOSES BREAKDOWN", bold: true, size: 28, color: "1E40AF" })]
        }),
        new Paragraph({ children: [] }),
        
        ...(data.diagnosesBreakdown.length > 0 ? [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Diagnosis", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "10B981" }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "10B981" }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "%", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "10B981" }
                  }),
                ]
              }),
              ...data.diagnosesBreakdown.slice(0, 10).map(d => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(d.diagnosis)] }),
                  new TableCell({ children: [new Paragraph(String(d.count))] }),
                  new TableCell({ children: [new Paragraph(`${d.percentage}%`)] }),
                ]
              }))
            ]
          })
        ] : [
          new Paragraph({
            children: [new TextRun({ text: "No diagnoses recorded today", italics: true, color: "666666" })]
          })
        ]),
        
        new Paragraph({ children: [] }),
        
        // Treatments Given
        new Paragraph({
          children: [new TextRun({ text: "TREATMENTS GIVEN", bold: true, size: 28, color: "1E40AF" })]
        }),
        new Paragraph({ children: [] }),
        
        ...(data.treatmentsGiven.length > 0 ? [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Treatment", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "F59E0B" }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "F59E0B" }
                  }),
                ]
              }),
              ...data.treatmentsGiven.slice(0, 10).map(t => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(t.treatment)] }),
                  new TableCell({ children: [new Paragraph(String(t.count))] }),
                ]
              }))
            ]
          })
        ] : [
          new Paragraph({
            children: [new TextRun({ text: "No treatments recorded today", italics: true, color: "666666" })]
          })
        ]),
        
        new Paragraph({ children: [] }),
        
        // Staff on Duty
        new Paragraph({
          children: [new TextRun({ text: "STAFF ON DUTY", bold: true, size: 28, color: "1E40AF" })]
        }),
        new Paragraph({ children: [] }),
        
        ...(data.staffOnDuty.length > 0 ? [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "8B5CF6" }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "8B5CF6" }
                  }),
                ]
              }),
              ...data.staffOnDuty.map(s => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(s.name)] }),
                  new TableCell({ children: [new Paragraph(s.role)] }),
                ]
              }))
            ]
          })
        ] : [
          new Paragraph({
            children: [new TextRun({ text: "No staff records available", italics: true, color: "666666" })]
          })
        ]),
        
        // Footer
        new Paragraph({ children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              size: 20,
              color: "CCCCCC"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleString('en-NG')}`,
              size: 18,
              italics: true,
              color: "666666"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "RUN Health Centre - Caring for You",
              size: 18,
              color: "1E40AF"
            })
          ]
        })
      ]
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `daily_report_${data.date.replace(/\//g, '-')}.docx`)
}

/**
 * Generate Daily Summary Report - PDF Format
 */
export async function generateDailySummaryPDF(data: DailyReportData): Promise<void> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(30, 64, 175)
  doc.text('RUN HEALTH CENTRE', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text("Redeemer's University, Ede, Osun State", 105, 28, { align: 'center' })
  
  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 32, 190, 32)
  
  // Title
  doc.setFontSize(16)
  doc.setTextColor(16, 185, 129)
  doc.text('DAILY SUMMARY REPORT', 105, 42, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(`Date: ${data.date}`, 105, 50, { align: 'center' })
  
  // Key Statistics Table
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('Key Statistics', 20, 65)
  
  autoTable(doc, {
    startY: 70,
    head: [['Metric', 'Count']],
    body: [
      ['Total Patients Seen', String(data.totalPatients)],
      ['New Registrations', String(data.newRegistrations)],
      ['Total Consultations', String(data.totalConsultations)],
      ['Lab Tests Performed', String(data.labTestsPerformed)],
      ['Prescriptions Dispensed', String(data.prescriptionsDispensed)],
    ],
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 20, right: 20 },
  })
  
  // Diagnoses Table
  const currentY = (doc as any).lastAutoTable?.finalY || 120
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('Top Diagnoses', 20, currentY + 15)
  
  if (data.diagnosesBreakdown.length > 0) {
    autoTable(doc, {
      startY: currentY + 20,
      head: [['Diagnosis', 'Count', '%']],
      body: data.diagnosesBreakdown.slice(0, 8).map(d => [d.diagnosis, String(d.count), `${d.percentage}%`]),
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 },
    })
  }
  
  // Treatments Table
  const treatmentsY = (doc as any).lastAutoTable?.finalY || currentY + 60
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('Treatments Given', 20, treatmentsY + 15)
  
  if (data.treatmentsGiven.length > 0) {
    autoTable(doc, {
      startY: treatmentsY + 20,
      head: [['Treatment', 'Count']],
      body: data.treatmentsGiven.slice(0, 8).map(t => [t.treatment, String(t.count)]),
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 20, right: 20 },
    })
  }
  
  // Footer
  const footerY = (doc as any).lastAutoTable?.finalY || 200
  doc.setDrawColor(200, 200, 200)
  doc.line(20, footerY + 20, 190, footerY + 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${new Date().toLocaleString('en-NG')}`, 105, footerY + 30, { align: 'center' })
  doc.setTextColor(30, 64, 175)
  doc.text('RUN Health Centre - Caring for You', 105, footerY + 38, { align: 'center' })
  
  doc.save(`daily_report_${data.date.replace(/\//g, '-')}.pdf`)
}

/**
 * Generate Daily Summary Report - Excel Format (CSV)
 */
export function generateDailySummaryExcel(data: DailyReportData): void {
  // Create multiple sheets as CSV files
  const statsCSV = [
    'Metric,Count',
    `Total Patients Seen,${data.totalPatients}`,
    `New Registrations,${data.newRegistrations}`,
    `Total Consultations,${data.totalConsultations}`,
    `Lab Tests Performed,${data.labTestsPerformed}`,
    `Prescriptions Dispensed,${data.prescriptionsDispensed}`,
  ].join('\n')
  
  const diagnosesCSV = [
    'Diagnosis,Count,Percentage',
    ...data.diagnosesBreakdown.map(d => `"${d.diagnosis}",${d.count},${d.percentage}%`)
  ].join('\n')
  
  const treatmentsCSV = [
    'Treatment,Count',
    ...data.treatmentsGiven.map(t => `"${t.treatment}",${t.count}`)
  ].join('\n')
  
  // Combine all into one file
  const combinedCSV = `RUN HEALTH CENTRE - DAILY REPORT (${data.date})
===========================================

KEY STATISTICS
${statsCSV}

DIAGNOSES BREAKDOWN
${diagnosesCSV}

TREATMENTS GIVEN
${treatmentsCSV}
`
  
  const blob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `daily_report_${data.date.replace(/\//g, '-')}.csv`)
}

/**
 * Generate Daily Report in specified format
 */
export async function generateDailyReport(data: DailyReportData, format: 'pdf' | 'docx' | 'excel'): Promise<void> {
  switch (format) {
    case 'pdf':
      await generateDailySummaryPDF(data)
      break
    case 'docx':
      await generateDailySummaryDOCX(data)
      break
    case 'excel':
      generateDailySummaryExcel(data)
      break
    default:
      await generateDailySummaryPDF(data)
  }
}

/**
 * Generate Patient Report PDF
 */
export async function generatePatientReportPDF(patient: PatientData, data: {
  vitals?: VitalSignData[]
  medications?: MedicationData[]
  diagnoses?: string[]
  notes?: string
}): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "RUN HEALTH CENTRE",
              bold: true,
              size: 32,
              color: "1E40AF"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Redeemer's University, Ede, Osun State",
              size: 20
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Patient Medical Report",
              bold: true,
              size: 28,
              color: "10B981"
            })
          ]
        }),
        new Paragraph({ children: [] }), // Spacer
        
        // Patient Information
        new Paragraph({
          children: [new TextRun({ text: "PATIENT INFORMATION", bold: true, size: 24 })]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Name: ${patient.name}`, size: 22 }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Hospital Number: ${patient.hospitalNumber}`, size: 22 }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Date of Birth: ${patient.dateOfBirth}`, size: 22 }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Gender: ${patient.gender}`, size: 22 }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Phone: ${patient.phone || 'N/A'}`, size: 22 }),
          ]
        }),
        new Paragraph({ children: [] }), // Spacer
        
        // Vital Signs
        ...(data.vitals && data.vitals.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: "VITAL SIGNS", bold: true, size: 24 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BP", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Temp", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pulse", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SpO2", bold: true })] })] }),
                ]
              }),
              ...data.vitals.map(v => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(v.date)] }),
                  new TableCell({ children: [new Paragraph(v.bp)] }),
                  new TableCell({ children: [new Paragraph(v.temp)] }),
                  new TableCell({ children: [new Paragraph(v.pulse)] }),
                  new TableCell({ children: [new Paragraph(v.spo2)] }),
                ]
              }))
            ]
          }),
          new Paragraph({ children: [] })
        ] : []),
        
        // Medications
        ...(data.medications && data.medications.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: "CURRENT MEDICATIONS", bold: true, size: 24 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Medication", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dosage", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Frequency", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })] }),
                ]
              }),
              ...data.medications.map(m => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(m.name)] }),
                  new TableCell({ children: [new Paragraph(m.dosage)] }),
                  new TableCell({ children: [new Paragraph(m.frequency)] }),
                  new TableCell({ children: [new Paragraph(m.duration)] }),
                ]
              }))
            ]
          }),
          new Paragraph({ children: [] })
        ] : []),
        
        // Diagnoses
        ...(data.diagnoses && data.diagnoses.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: "DIAGNOSES", bold: true, size: 24 })]
          }),
          ...data.diagnoses.map(d => new Paragraph({
            children: [new TextRun({ text: `• ${d}`, size: 22 })]
          })),
          new Paragraph({ children: [] })
        ] : []),
        
        // Notes
        ...(data.notes ? [
          new Paragraph({
            children: [new TextRun({ text: "CLINICAL NOTES", bold: true, size: 24 })]
          }),
          new Paragraph({
            children: [new TextRun({ text: data.notes, size: 22 })]
          })
        ] : []),
        
        // Footer
        new Paragraph({ children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleDateString('en-NG')}`,
              size: 18,
              italics: true,
              color: "666666"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "RUN Health Centre - Caring for You",
              size: 18,
              color: "1E40AF"
            })
          ]
        })
      ]
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `patient_report_${patient.hospitalNumber}_${new Date().toISOString().split('T')[0]}.docx`)
}

/**
 * Generate Lab Report PDF
 */
export async function generateLabReportPDF(data: {
  patientName: string
  hospitalNumber: string
  testName: string
  result: string
  unit?: string
  referenceRange?: string
  isAbnormal?: boolean
  notes?: string
}): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "RUN HEALTH CENTRE - LABORATORY REPORT", bold: true, size: 28, color: "1E40AF" })]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: `Patient: ${data.patientName}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Hospital Number: ${data.hospitalNumber}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString('en-NG')}`, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({
          children: [new TextRun({ text: "TEST RESULT", bold: true, size: 24 })]
        }),
        new Paragraph({ children: [new TextRun({ text: `Test: ${data.testName}`, size: 22 })] }),
        new Paragraph({ 
          children: [
            new TextRun({ 
              text: `Result: ${data.result}${data.unit ? ` ${data.unit}` : ''}`, 
              size: 24,
              bold: true,
              color: data.isAbnormal ? "EF4444" : "10B981"
            })
          ] 
        }),
        ...(data.referenceRange ? [
          new Paragraph({ children: [new TextRun({ text: `Reference Range: ${data.referenceRange}`, size: 20 })] })
        ] : []),
        ...(data.notes ? [
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: "Notes:", bold: true, size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: data.notes, size: 20 })] })
        ] : []),
        new Paragraph({ children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "This is a computer-generated report", size: 16, italics: true, color: "666666" })]
        })
      ]
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `lab_report_${data.hospitalNumber}_${new Date().toISOString().split('T')[0]}.docx`)
}

/**
 * Export to CSV
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h]
        const str = String(value ?? '')
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export patients to CSV
 */
export function exportPatientsToCSV(patients: Array<{
  hospitalNumber: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  phone?: string
  email?: string
}>): void {
  const data = patients.map(p => ({
    'Hospital Number': p.hospitalNumber,
    'First Name': p.firstName,
    'Last Name': p.lastName,
    'Gender': p.gender,
    'Date of Birth': p.dateOfBirth,
    'Phone': p.phone || '',
    'Email': p.email || ''
  }))
  exportToCSV(data, 'patients_export')
}

/**
 * Export appointments to CSV
 */
export function exportAppointmentsToCSV(appointments: Array<{
  patientName: string
  doctorName: string
  date: string
  type: string
  status: string
}>): void {
  const data = appointments.map(a => ({
    'Patient Name': a.patientName,
    'Doctor': a.doctorName,
    'Date': a.date,
    'Type': a.type,
    'Status': a.status
  }))
  exportToCSV(data, 'appointments_export')
}

/**
 * Generate bill receipt PDF
 */
export async function generateReceiptPDF(data: {
  receiptNumber: string
  patientName: string
  hospitalNumber: string
  items: Array<{ description: string; amount: number }>
  total: number
  paymentMethod: string
  collectedBy: string
}): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "RUN HEALTH CENTRE", bold: true, size: 32, color: "1E40AF" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PAYMENT RECEIPT", bold: true, size: 28 })]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: `Receipt No: ${data.receiptNumber}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString('en-NG')}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Patient: ${data.patientName}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Hospital No: ${data.hospitalNumber}`, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({
          children: [new TextRun({ text: "ITEMS", bold: true, size: 24 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount (₦)", bold: true })] })] }),
              ]
            }),
            ...data.items.map(item => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(item.description)] }),
                new TableCell({ children: [new Paragraph(item.amount.toLocaleString())] }),
              ]
            })),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₦${data.total.toLocaleString()}`, bold: true })] })] }),
              ]
            })
          ]
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: `Payment Method: ${data.paymentMethod}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `Collected By: ${data.collectedBy}`, size: 22 })] }),
        new Paragraph({ children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Thank you for your payment", size: 20, italics: true })]
        })
      ]
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `receipt_${data.receiptNumber}.docx`)
}
