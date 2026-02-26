'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, Download } from 'lucide-react'

// RUN Logo - Base64 encoded for print consistency
const RUN_LOGO_BASE64 = '/runlogo.jpg'

// Print styles - inject into document head
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
  .page-break {
    page-break-before: always;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = printStyles
  document.head.appendChild(styleElement)
}

// Utility function to generate filename with surname_firstname_middlename format
export function generatePatientFileName(patient: Patient, documentType: string, extension: string = 'pdf'): string {
  const surname = (patient.lastName || 'Unknown').replace(/\s+/g, '_')
  const firstName = (patient.firstName || '').replace(/\s+/g, '_')
  const middleName = patient.middleName ? `_${patient.middleName.replace(/\s+/g, '_')}` : ''
  const date = new Date().toISOString().split('T')[0]
  
  return `${surname}_${firstName}${middleName}_${documentType}_${date}.${extension}`
}

// Get full patient name for display
export function getPatientFullName(patient: Patient): string {
  return `${patient.title ? patient.title + ' ' : ''}${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`
}

interface Patient {
  ruhcCode: string
  firstName: string
  lastName: string
  middleName?: string
  title?: string
  dateOfBirth: string
  gender: string
  bloodGroup?: string
  phone?: string
  address?: string
}

interface PrescriptionItem {
  drugName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface PrintPrescriptionProps {
  patient: Patient
  items: PrescriptionItem[]
  doctorName: string
  doctorInitials: string
  date: string
  diagnosis?: string
}

export function PrintPrescription({ patient, items, doctorName, doctorInitials, date, diagnosis }: PrintPrescriptionProps) {
  const handlePrint = () => {
    window.print()
  }
  
  const fileName = generatePatientFileName(patient, 'Prescription')
  
  return (
    <div className="print-area">
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" /> Print Prescription
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto border-2 border-blue-200" id="prescription-print">
        <CardContent className="p-6">
          {/* Header with RUN Logo */}
          <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src={RUN_LOGO_BASE64} 
                alt="RUN Logo" 
                className="h-20 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-800">RUN HEALTH CENTRE</h1>
                <p className="text-sm text-gray-600">Redeemer's University, Ede, Osun State</p>
                <p className="text-xs text-gray-500">Tel: +234 806 882 8822 | runhealthcentre@run.edu.ng</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-center text-lg font-bold text-blue-700 mb-4 bg-blue-50 py-2 rounded">
            PRESCRIPTION
          </h2>
          
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-bold">Patient:</span> {patient.title} {patient.firstName} {patient.middleName || ''} {patient.lastName}
            </div>
            <div>
              <span className="font-bold">Date:</span> {new Date(date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-bold">Hospital No:</span> {patient.ruhcCode}
            </div>
            <div>
              <span className="font-bold">Age/Gender:</span> {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y / {patient.gender}
            </div>
          </div>
          
          {diagnosis && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <span className="font-bold">Diagnosis:</span> {diagnosis}
            </div>
          )}
          
          {/* Prescription Table */}
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 p-2 text-left">#</th>
                <th className="border border-gray-300 p-2 text-left">Drug Name</th>
                <th className="border border-gray-300 p-2 text-left">Dosage</th>
                <th className="border border-gray-300 p-2 text-left">Frequency</th>
                <th className="border border-gray-300 p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2 font-medium">{item.drugName}</td>
                  <td className="border border-gray-300 p-2">{item.dosage}</td>
                  <td className="border border-gray-300 p-2">{item.frequency}</td>
                  <td className="border border-gray-300 p-2">{item.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Instructions */}
          <div className="mb-4 text-sm">
            <p className="font-bold">Instructions:</p>
            <ul className="list-disc list-inside text-gray-600">
              {items.filter(i => i.instructions).map((item, index) => (
                <li key={index}>{item.drugName}: {item.instructions}</li>
              ))}
            </ul>
          </div>
          
          {/* Signature */}
          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">Prescriber:</p>
              <p className="font-bold">{doctorName}</p>
              <p className="text-sm text-gray-500">({doctorInitials})</p>
            </div>
            <div className="text-right">
              <div className="border-t border-gray-400 w-48 pt-1">
                <p className="text-xs text-gray-500">Signature / Stamp</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface LabResultPrintProps {
  patient: Patient
  testName: string
  result: string
  unit?: string
  referenceRange?: string
  isAbnormal?: boolean
  notes?: string
  technicianInitials: string
  verifiedBy?: string
  date: string
}

export function LabResultPrint({
  patient,
  testName,
  result,
  unit,
  referenceRange,
  isAbnormal,
  notes,
  technicianInitials,
  verifiedBy,
  date
}: LabResultPrintProps) {
  const handlePrint = () => {
    window.print()
  }
  
  const fileName = generatePatientFileName(patient, 'Lab_Result')
  
  return (
    <div className="print-area">
      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" /> Print Lab Result
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto border-2 border-teal-200" id="lab-print">
        <CardContent className="p-6">
          {/* Header with RUN Logo */}
          <div className="text-center border-b-2 border-teal-600 pb-4 mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src={RUN_LOGO_BASE64} 
                alt="RUN Logo" 
                className="h-20 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-teal-800">RUN HEALTH CENTRE</h1>
                <p className="text-lg font-semibold text-teal-600 mt-1">LABORATORY DEPARTMENT</p>
                <p className="text-sm text-gray-600">Redeemer's University, Ede, Osun State</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-center text-lg font-bold text-teal-700 mb-4 bg-teal-50 py-2 rounded">
            LABORATORY REPORT
          </h2>
          
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-b pb-4">
            <div><span className="font-bold">Patient:</span> {patient.firstName} {patient.lastName}</div>
            <div><span className="font-bold">Hospital No:</span> {patient.ruhcCode}</div>
            <div><span className="font-bold">Age/Sex:</span> {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y / {patient.gender}</div>
            <div><span className="font-bold">Date:</span> {new Date(date).toLocaleDateString()}</div>
          </div>
          
          {/* Test Result */}
          <div className={`p-4 rounded-lg mb-4 ${isAbnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Test Name</p>
                <p className="font-bold text-lg">{testName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Result</p>
                <p className={`font-bold text-xl ${isAbnormal ? 'text-red-600' : 'text-green-600'}`}>
                  {result} {unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reference Range</p>
                <p className="font-medium">{referenceRange || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-bold ${isAbnormal ? 'text-red-600' : 'text-green-600'}`}>
                  {isAbnormal ? '⚠️ ABNORMAL' : '✓ Normal'}
                </p>
              </div>
            </div>
          </div>
          
          {notes && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <span className="font-bold">Notes:</span> {notes}
            </div>
          )}
          
          {/* Signatures */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 w-full pt-1">
                <p className="text-sm font-medium">Laboratory Technician</p>
                <p className="text-sm text-gray-600">{technicianInitials}</p>
              </div>
            </div>
            {verifiedBy && (
              <div className="text-center">
                <div className="border-t border-gray-400 w-full pt-1">
                  <p className="text-sm font-medium">Verified By</p>
                  <p className="text-sm text-gray-600">{verifiedBy}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PatientCardPrintProps {
  patient: Patient
  qrCodeSvg?: string
}

export function PatientCardPrint({ patient, qrCodeSvg }: PatientCardPrintProps) {
  const handlePrint = () => {
    window.print()
  }
  
  const fileName = generatePatientFileName(patient, 'Patient_Card')
  
  return (
    <div className="print-area">
      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" /> Print Patient Card
        </Button>
      </div>
      
      <div 
        className="max-w-xs mx-auto border-2 border-blue-600 rounded-xl p-4 bg-white shadow-lg"
        style={{ width: '85mm', height: '55mm' }}
        id="patient-card-print"
      >
        <div className="flex items-center h-full">
          {/* RUN Logo */}
          <div className="flex-shrink-0 mr-2">
            <img 
              src={RUN_LOGO_BASE64} 
              alt="RUN Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          
          {/* QR Code Area */}
          <div className="flex-shrink-0 mr-3">
            {qrCodeSvg ? (
              <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                QR
              </div>
            )}
          </div>
          
          {/* Patient Info */}
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600">RUN HEALTH CENTRE</p>
            <p className="text-lg font-bold">{patient.ruhcCode}</p>
            <p className="font-medium text-sm">{patient.firstName} {patient.lastName}</p>
            <p className="text-xs text-gray-600">
              {new Date(patient.dateOfBirth).toLocaleDateString()} | {patient.gender}
            </p>
            {patient.bloodGroup && (
              <p className="text-xs font-medium text-red-600">
                Blood Group: {patient.bloodGroup}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Medical Certificate Print Component
interface MedicalCertificateProps {
  patient: Patient
  type: 'sick_leave' | 'fitness' | 'medical_report'
  days?: number
  startDate?: string
  endDate?: string
  diagnosis?: string
  recommendations?: string
  doctorName: string
  doctorInitials: string
  date: string
}

export function MedicalCertificatePrint({
  patient,
  type,
  days,
  startDate,
  endDate,
  diagnosis,
  recommendations,
  doctorName,
  doctorInitials,
  date
}: MedicalCertificateProps) {
  const handlePrint = () => {
    window.print()
  }
  
  const titles = {
    sick_leave: 'MEDICAL CERTIFICATE OF ILLNESS',
    fitness: 'MEDICAL CERTIFICATE OF FITNESS',
    medical_report: 'MEDICAL REPORT'
  }
  
  const fileName = generatePatientFileName(patient, 'Medical_Certificate')
  
  return (
    <div className="print-area">
      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" /> Print Certificate
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto border-2 border-blue-200" id="certificate-print">
        <CardContent className="p-8">
          {/* Header with RUN Logo */}
          <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src={RUN_LOGO_BASE64} 
                alt="RUN Logo" 
                className="h-24 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-blue-800">RUN HEALTH CENTRE</h1>
                <p className="text-sm text-gray-600">Redeemer's University, Ede, Osun State</p>
                <p className="text-xs text-gray-500">runhealthcentre@run.edu.ng</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-center text-xl font-bold text-blue-700 mb-6 underline">
            {titles[type]}
          </h2>
          
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              This is to certify that <span className="font-bold">{patient.title} {patient.firstName} {patient.lastName}</span> 
              {' '}(Hospital No: <span className="font-bold">{patient.ruhcCode}</span>) was examined at RUN Health Centre.
            </p>
            
            {type === 'sick_leave' && days && (
              <p>
                The patient is advised to rest for a period of <span className="font-bold">{days} day(s)</span>
                {startDate && endDate && (
                  <span> from <span className="font-bold">{new Date(startDate).toLocaleDateString()}</span> to <span className="font-bold">{new Date(endDate).toLocaleDateString()}</span></span>
                )}.
              </p>
            )}
            
            {type === 'fitness' && (
              <p className="text-green-700 font-medium">
                The patient has been examined and found to be medically FIT for normal duties/activities.
              </p>
            )}
            
            {diagnosis && (
              <p><span className="font-bold">Diagnosis:</span> {diagnosis}</p>
            )}
            
            {recommendations && (
              <p><span className="font-bold">Recommendations:</span> {recommendations}</p>
            )}
          </div>
          
          {/* Signature */}
          <div className="mt-12 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">Examining Physician:</p>
              <p className="font-bold">{doctorName}</p>
              <p className="text-sm text-gray-500">({doctorInitials})</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Date: {new Date(date).toLocaleDateString()}</p>
              <div className="border-t border-gray-400 w-48 pt-1">
                <p className="text-xs text-gray-500">Signature & Stamp</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
