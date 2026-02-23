'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText, Printer } from 'lucide-react'

interface DocumentDownloadButtonProps {
  documentType: string
  data: any
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

// Document type labels
const DOCUMENT_LABELS: Record<string, string> = {
  patient_registration: 'Patient Registration',
  vital_signs_record: 'Vital Signs Record',
  nurse_notes: 'Nursing Notes',
  doctor_consultation: 'Consultation Notes',
  medication_administration: 'MAR',
  lab_result: 'Lab Results',
  discharge_summary: 'Discharge Summary',
  medical_certificate: 'Medical Certificate',
  referral_letter: 'Referral Letter',
  prescription: 'Prescription'
}

export function DocumentDownloadButton({
  documentType,
  data,
  label,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  className = ''
}: DocumentDownloadButtonProps) {
  
  const handleDownload = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, data })
      })

      if (!response.ok) {
        throw new Error('Failed to generate document')
      }

      const result = await response.json()
      
      if (result.success && result.html) {
        // Open in new window for printing
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(result.html)
          printWindow.document.close()
          // Auto-trigger print dialog
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      }
    } catch (error) {
      console.error('Document download error:', error)
      alert('Failed to generate document. Please try again.')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={className}
      title={`Download ${DOCUMENT_LABELS[documentType] || documentType}`}
    >
      {showIcon && <Download className="h-4 w-4 mr-1" />}
      {label || DOCUMENT_LABELS[documentType] || 'Download'}
    </Button>
  )
}

// Print button component
export function PrintDocumentButton({
  documentType,
  data,
  label = 'Print',
  variant = 'outline',
  size = 'sm',
  className = ''
}: DocumentDownloadButtonProps) {
  
  const handlePrint = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, data })
      })

      if (!response.ok) {
        throw new Error('Failed to generate document')
      }

      const result = await response.json()
      
      if (result.success && result.html) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(result.html)
          printWindow.document.close()
          printWindow.print()
        }
      }
    } catch (error) {
      console.error('Print error:', error)
      alert('Failed to print document. Please try again.')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={className}
    >
      <Printer className="h-4 w-4 mr-1" />
      {label}
    </Button>
  )
}

// Quick download buttons for patient detail view
export function PatientDocumentButtons({ patient, vitals, medications, consultations }: {
  patient: any
  vitals: any[]
  medications: any[]
  consultations: any[]
}) {
  const downloadDocument = async (documentType: string, data: any) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, data })
      })

      const result = await response.json()
      
      if (result.success && result.html) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(result.html)
          printWindow.document.close()
          setTimeout(() => printWindow.print(), 500)
        }
      }
    } catch (error) {
      console.error('Document error:', error)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadDocument('patient_registration', { patient })}
      >
        <FileText className="h-4 w-4 mr-1" />
        Registration Form
      </Button>
      
      {vitals && vitals.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadDocument('vital_signs_record', { patient, vitals })}
        >
          <FileText className="h-4 w-4 mr-1" />
          Vital Signs
        </Button>
      )}
      
      {medications && medications.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadDocument('medication_administration', { patient, medications })}
        >
          <FileText className="h-4 w-4 mr-1" />
          MAR
        </Button>
      )}
      
      {consultations && consultations.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadDocument('doctor_consultation', { 
            patient, 
            consultation: consultations[consultations.length - 1] 
          })}
        >
          <FileText className="h-4 w-4 mr-1" />
          Last Consultation
        </Button>
      )}
    </div>
  )
}

export default DocumentDownloadButton
