/**
 * Report Generation Utilities
 * PDF and Excel export functionality
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType } from 'docx'
import { saveAs } from 'file-saver'

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
