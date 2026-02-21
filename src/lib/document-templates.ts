// Document Templates for RUN Health Centre
// All documents include hospital branding and logo

export interface DocumentTemplate {
  title: string;
  subtitle?: string;
  header: DocumentHeader;
  content: DocumentContent;
  footer?: DocumentFooter;
}

export interface DocumentHeader {
  logoUrl: string;
  hospitalName: string;
  hospitalAddress: string;
  documentTitle: string;
  documentDate?: string;
}

export interface DocumentContent {
  sections: DocumentSection[];
}

export interface DocumentSection {
  title?: string;
  type: 'text' | 'table' | 'grid' | 'signature' | 'vitals_chart' | 'medication_table';
  data: Record<string, any>;
}

export interface DocumentFooter {
  preparedBy?: string;
  preparedByTitle?: string;
  signature?: string;
  date?: string;
  disclaimer?: string;
}

// Hospital branding constants
export const HOSPITAL_BRANDING = {
  universityName: "Redeemer's University",
  healthCentreName: "Health Centre",
  systemName: "Hospital Management System",
  address: "Ede, Osun State, Nigeria",
  logoPath: "/runlogo.jpg",
  motto: "Excellence in Healthcare",
  established: "2005"
};

// Document type definitions
export type DocumentType = 
  | 'patient_registration'
  | 'vital_signs_record'
  | 'nurse_notes'
  | 'doctor_consultation'
  | 'medication_administration'
  | 'lab_result'
  | 'prescription'
  | 'discharge_summary'
  | 'medical_certificate'
  | 'referral_letter'
  | 'appointment_card'
  | 'bill_receipt'
  | 'ward_admission'
  | 'nursing_care_plan';

// Generate document header HTML with single logo - Simplified as requested
export function generateDocumentHeader(title: string, date?: string): string {
  const docDate = date || new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1e40af; padding-bottom: 15px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
        <img src="${HOSPITAL_BRANDING.logoPath}" alt="Logo" style="height: 100px; width: auto;">
        <div>
          <h1 style="color: #1e40af; font-size: 26px; margin: 0; font-family: 'Times New Roman', serif; font-weight: bold;">
            ${HOSPITAL_BRANDING.universityName}
          </h1>
          <h2 style="color: #059669; font-size: 22px; margin: 5px 0; font-family: 'Times New Roman', serif;">
            ${HOSPITAL_BRANDING.healthCentreName}
          </h2>
          <h3 style="color: #374151; font-size: 16px; margin: 5px 0; font-family: 'Times New Roman', serif; font-style: italic;">
            ${HOSPITAL_BRANDING.systemName}
          </h3>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            ${HOSPITAL_BRANDING.address}
          </p>
        </div>
      </div>
      <h2 style="color: #1e40af; font-size: 18px; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        ${title}
      </h2>
      <p style="color: #6b7280; font-size: 12px;">Date: ${docDate}</p>
    </div>
  `;
}

// Generate document footer with signature areas - Only Nurse, Matron, CMD
export function generateDocumentFooter(nurseInitials: string, matronInitials?: string, cmdInitials?: string, disclaimer?: string): string {
  return `
    <div style="margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 20px;">
      <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 15px; text-align: center;">AUTHENTICATION</h4>
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 20px;">
        <div style="text-align: center; width: 30%;">
          <div style="border-bottom: 1px solid #000; width: 180px; margin: 0 auto 5px; height: 40px;"></div>
          <p style="margin: 0; font-size: 12px; font-weight: bold;">${nurseInitials || 'Nurse'}</p>
          <p style="margin: 0; font-size: 10px; color: #6b7280;">Nurse / Recording Officer</p>
        </div>
        <div style="text-align: center; width: 30%;">
          <div style="border-bottom: 1px solid #000; width: 180px; margin: 0 auto 5px; height: 40px;"></div>
          <p style="margin: 0; font-size: 12px; font-weight: bold;">${matronInitials || 'Matron'}</p>
          <p style="margin: 0; font-size: 10px; color: #6b7280;">Matron / Nursing Services</p>
        </div>
        <div style="text-align: center; width: 30%;">
          <div style="border-bottom: 1px solid #000; width: 180px; margin: 0 auto 5px; height: 40px;"></div>
          <p style="margin: 0; font-size: 12px; font-weight: bold;">${cmdInitials || 'CMD'}</p>
          <p style="margin: 0; font-size: 10px; color: #6b7280;">CMD / Director</p>
        </div>
      </div>
      ${disclaimer ? `
        <p style="font-size: 10px; color: #6b7280; text-align: center; font-style: italic;">
          ${disclaimer}
        </p>
      ` : ''}
      <p style="font-size: 10px; color: #9ca3af; text-align: center; margin-top: 10px;">
        This document was generated electronically from ${HOSPITAL_BRANDING.universityName} ${HOSPITAL_BRANDING.healthCentreName} Management System
      </p>
    </div>
  `;
}

// Format patient info block - Enhanced with matric number
export function formatPatientInfoBlock(patient: any): string {
  const fullName = patient.title 
    ? `${patient.title} ${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`
    : `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`;

  const age = patient.dateOfBirth 
    ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years`
    : 'N/A';

  return `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
        Patient Information
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
        <div><strong>RUHC Code:</strong> ${patient.ruhcCode || 'N/A'}</div>
        <div><strong>Matric/Staff No:</strong> ${patient.matricNumber || 'N/A'}</div>
        <div><strong>Surname:</strong> ${patient.lastName}</div>
        <div><strong>First Name:</strong> ${patient.firstName}</div>
        ${patient.middleName ? `<div><strong>Middle Name:</strong> ${patient.middleName}</div>` : ''}
        <div><strong>Gender:</strong> ${patient.gender || 'N/A'}</div>
        <div><strong>Date of Birth:</strong> ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-NG') : 'N/A'}</div>
        <div><strong>Age:</strong> ${age}</div>
        <div><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</div>
        <div><strong>Genotype:</strong> ${patient.genotype || 'N/A'}</div>
        <div><strong>Nationality:</strong> ${patient.nationality || 'Nigerian'}</div>
        <div><strong>Religion:</strong> ${patient.religion || 'N/A'}</div>
        ${patient.allergies ? `<div style="grid-column: span 2; color: #dc2626;"><strong>⚠️ Allergies:</strong> ${patient.allergies}</div>` : ''}
        ${patient.chronicConditions ? `<div style="grid-column: span 2;"><strong>Chronic Conditions:</strong> ${patient.chronicConditions}</div>` : ''}
      </div>
    </div>
  `;
}

// Format vital signs table
export function formatVitalSignsTable(vitals: any[]): string {
  if (!vitals || vitals.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No vital signs recorded.</p>';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
      <thead>
        <tr style="background: #1e40af; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px;">Date/Time</th>
          <th style="border: 1px solid #ddd; padding: 10px;">BP (mmHg)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Temp (°C)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Pulse (bpm)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">RR (/min)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Weight (kg)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">SpO₂ (%)</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Nurse</th>
        </tr>
      </thead>
      <tbody>
        ${vitals.map((v, i) => `
          <tr style="background: ${i % 2 === 0 ? '#fff' : '#f8fafc'};">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(v.recordedAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.bloodPressureSystolic || '-'}/${v.bloodPressureDiastolic || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.temperature || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.pulse || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.respiratoryRate || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.weight || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.oxygenSaturation || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${v.nurseInitials || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Format medication administration record
export function formatMedicationTable(medications: any[]): string {
  if (!medications || medications.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No medications administered.</p>';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
      <thead>
        <tr style="background: #059669; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px;">Date/Time</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Drug Name</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Dosage</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Route</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Nurse</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Notes</th>
        </tr>
      </thead>
      <tbody>
        ${medications.map((m, i) => `
          <tr style="background: ${i % 2 === 0 ? '#fff' : '#f0fdf4'};">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(m.administeredAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${m.drugName}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${m.dosage}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${m.route}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${m.nurseInitials}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${m.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Format lab results table
export function formatLabResultsTable(results: any[]): string {
  if (!results || results.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No lab results available.</p>';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
      <thead>
        <tr style="background: #7c3aed; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px;">Test Name</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Result</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Unit</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Reference Range</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Status</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Technician</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((r, i) => `
          <tr style="background: ${i % 2 === 0 ? '#fff' : '#f5f3ff'}; ${r.isAbnormal ? 'color: #dc2626;' : ''}">
            <td style="border: 1px solid #ddd; padding: 8px;">${r.testName || r.test?.name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: ${r.isAbnormal ? 'bold' : 'normal'};">${r.result}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${r.unit || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${r.referenceRange || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
              <span style="padding: 2px 8px; border-radius: 4px; background: ${r.isAbnormal ? '#fef2f2' : '#f0fdf4'}; color: ${r.isAbnormal ? '#dc2626' : '#059669'};">
                ${r.isAbnormal ? 'ABNORMAL' : 'Normal'}
              </span>
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${r.technicianInitials || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Format prescription table
export function formatPrescriptionTable(items: any[]): string {
  if (!items || items.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No prescriptions.</p>';
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
      <thead>
        <tr style="background: #dc2626; color: white;">
          <th style="border: 1px solid #ddd; padding: 10px;">S/N</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Drug Name</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Dosage</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Frequency</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Duration</th>
          <th style="border: 1px solid #ddd; padding: 10px;">Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, i) => `
          <tr style="background: ${i % 2 === 0 ? '#fff' : '#fef2f2'};">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.drugName}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.dosage}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.frequency}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.duration}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.instructions || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Generate complete HTML document for printing
export function generatePrintableDocument(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - RUHC</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          padding: 20px;
          background: white;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Times New Roman', Times, serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
        }
        .content {
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          border-top: 1px solid #d1d5db;
          padding-top: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 10px;
          border-radius: 4px;
          color: #92400e;
        }
        .danger {
          background: #fee2e2;
          border: 1px solid #ef4444;
          padding: 10px;
          border-radius: 4px;
          color: #991b1b;
        }
        .success {
          background: #d1fae5;
          border: 1px solid #10b981;
          padding: 10px;
          border-radius: 4px;
          color: #065f46;
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        // Auto-print when loaded (optional)
        // window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
}

// Document title mappings
export const DOCUMENT_TITLES: Record<DocumentType, string> = {
  patient_registration: 'Patient Registration Form',
  vital_signs_record: 'Vital Signs Record',
  nurse_notes: 'Nursing Notes',
  doctor_consultation: 'Doctor Consultation Notes',
  medication_administration: 'Medication Administration Record (MAR)',
  lab_result: 'Laboratory Result Report',
  prescription: 'Prescription',
  discharge_summary: 'Discharge Summary',
  medical_certificate: 'Medical Certificate',
  referral_letter: 'Referral Letter',
  appointment_card: 'Appointment Card',
  bill_receipt: 'Payment Receipt',
  ward_admission: 'Ward Admission Form',
  nursing_care_plan: 'Nursing Care Plan'
};
