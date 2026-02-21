import { NextRequest, NextResponse } from 'next/server';
import { 
  HOSPITAL_BRANDING,
  generateDocumentHeader,
  generateDocumentFooter,
  formatPatientInfoBlock,
  formatVitalSignsTable,
  formatMedicationTable,
  formatLabResultsTable,
  formatPrescriptionTable,
  generatePrintableDocument,
  DOCUMENT_TITLES,
  DocumentType
} from '@/lib/document-templates';

// Helper to get full name
function getFullName(firstName: string, lastName: string, middleName?: string, title?: string): string {
  const name = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  return title ? `${title} ${name}` : name;
}

// Helper to format date
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate Patient Registration Document
function generatePatientRegistration(patient: any, nurseInitials?: string): string {
  const content = `
    ${generateDocumentHeader('Patient Registration Form', formatDate(new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}
    
    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Next of Kin Information
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <div><strong>Name:</strong> ${patient.nokName || 'N/A'}</div>
        <div><strong>Relationship:</strong> ${patient.nokRelationship || 'N/A'}</div>
        <div><strong>Phone:</strong> ${patient.nokPhone || 'N/A'}</div>
        <div><strong>Address:</strong> ${patient.nokAddress || 'N/A'}</div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Emergency Contact
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <div><strong>Name:</strong> ${patient.emergencyContactName || 'N/A'}</div>
        <div><strong>Relationship:</strong> ${patient.emergencyContactRelationship || 'N/A'}</div>
        <div><strong>Phone:</strong> ${patient.emergencyContactPhone || 'N/A'}</div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Medical History
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <div style="grid-column: span 2;"><strong>Known Allergies:</strong> ${patient.allergies || 'None documented'}</div>
        <div style="grid-column: span 2;"><strong>Chronic Conditions:</strong> ${patient.chronicConditions || 'None documented'}</div>
        <div style="grid-column: span 2;"><strong>Current Medications:</strong> ${patient.currentMedications || 'None documented'}</div>
        <div style="grid-column: span 2;"><strong>Family History:</strong> ${patient.familyHistory || 'None documented'}</div>
        <div style="grid-column: span 2;"><strong>Surgical History:</strong> ${patient.surgicalHistory || 'None documented'}</div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Registration Details
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <div><strong>Registered At:</strong> ${formatDate(patient.registeredAt)}</div>
        <div><strong>Registered By:</strong> ${patient.registeredBy || 'N/A'}</div>
        <div><strong>Status:</strong> ${patient.isActive ? 'Active' : 'Inactive'}</div>
      </div>
    </div>

    ${generateDocumentFooter(
      nurseInitials || patient.registeredBy || 'Records Officer',
      '',
      '',
      'This document contains confidential patient information. Handle in accordance with hospital policy.'
    )}
  `;

  return generatePrintableDocument('Patient Registration Form', content);
}

// Generate Vital Signs Record
function generateVitalSignsRecord(patient: any, vitals: any[], nurseInitials?: string): string {
  const lastVital = vitals[vitals.length - 1];
  const content = `
    ${generateDocumentHeader('Vital Signs Record', formatDate(new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Vital Signs Chart
      </h3>
      ${formatVitalSignsTable(vitals)}
    </div>

    <div style="margin-top: 20px; background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #1e40af;">
      <h4 style="color: #1e40af; margin-bottom: 10px;">Vital Signs Reference Ranges</h4>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px;">
        <div><strong>Blood Pressure:</strong> 90/60 - 120/80 mmHg</div>
        <div><strong>Temperature:</strong> 36.1 - 37.2 °C</div>
        <div><strong>Pulse Rate:</strong> 60 - 100 bpm</div>
        <div><strong>Respiratory Rate:</strong> 12 - 20 /min</div>
        <div><strong>Oxygen Saturation:</strong> 95 - 100%</div>
      </div>
    </div>

    ${generateDocumentFooter(
      nurseInitials || lastVital?.nurseInitials || 'Nursing Staff',
      '',
      '',
      'These vital signs should be interpreted in clinical context.'
    )}
  `;

  return generatePrintableDocument('Vital Signs Record', content);
}

// Generate Nursing Notes
function generateNursingNotes(patient: any, vitals: any[], medications: any[], notes: string, nurseInitials: string): string {
  const content = `
    ${generateDocumentHeader('Nursing Notes', formatDate(new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Current Vital Signs
      </h3>
      ${vitals.length > 0 ? formatVitalSignsTable([vitals[vitals.length - 1]]) : '<p style="color: #6b7280; font-style: italic;">No vital signs recorded.</p>'}
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Medications Administered
      </h3>
      ${formatMedicationTable(medications)}
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Nursing Assessment & Notes
      </h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; min-height: 200px;">
        ${notes || '<p style="color: #6b7280; font-style: italic;">No notes documented.</p>'}
      </div>
    </div>

    ${generateDocumentFooter(
      nurseInitials || 'Nursing Staff',
      '',
      '',
      'This document is part of the patient\'s medical record.'
    )}
  `;

  return generatePrintableDocument('Nursing Notes', content);
}

// Generate Doctor Consultation Notes
function generateDoctorConsultation(consultation: any, patient: any): string {
  const content = `
    ${generateDocumentHeader('Doctor Consultation Notes', formatDate(consultation.createdAt || new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Chief Complaint
      </h3>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        ${consultation.chiefComplaint || 'Not documented'}
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        History of Present Illness
      </h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
        ${consultation.historyOfPresentIllness || 'Not documented'}
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Examination Findings
      </h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p><strong>General:</strong> ${consultation.generalExamination || 'Not documented'}</p>
        <p style="margin-top: 10px;"><strong>System:</strong> ${consultation.systemExamination || 'Not documented'}</p>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Diagnosis
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <strong>Provisional:</strong><br/>${consultation.provisionalDiagnosis || 'Not documented'}
        </div>
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
          <strong>Final:</strong><br/>${consultation.finalDiagnosis || 'Not documented'}
        </div>
      </div>
    </div>

    ${consultation.prescriptionItems && consultation.prescriptionItems.length > 0 ? `
    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Prescription
      </h3>
      ${formatPrescriptionTable(consultation.prescriptionItems)}
    </div>
    ` : ''}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Treatment Plan & Advice
      </h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p><strong>Treatment:</strong> ${consultation.treatmentPlan || 'Not documented'}</p>
        <p style="margin-top: 10px;"><strong>Advice:</strong> ${consultation.advice || 'Not documented'}</p>
      </div>
    </div>

    ${generateDocumentFooter(
      consultation.sentByNurseInitials || 'Nurse',
      '',
      consultation.doctorInitials || 'Doctor',
      'This document contains confidential medical information.'
    )}
  `;

  return generatePrintableDocument('Doctor Consultation Notes', content);
}

// Generate MAR
function generateMAR(patient: any, medications: any[], nurseInitials?: string): string {
  const content = `
    ${generateDocumentHeader('Medication Administration Record (MAR)', formatDate(new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Medication Administration Record
      </h3>
      ${formatMedicationTable(medications)}
    </div>

    ${generateDocumentFooter(
      nurseInitials || medications[0]?.nurseInitials || 'Nursing Staff',
      '',
      '',
      'This is an official medical record.'
    )}
  `;

  return generatePrintableDocument('Medication Administration Record', content);
}

// Generate Lab Result
function generateLabResult(patient: any, results: any[], technicianInitials?: string): string {
  const content = `
    ${generateDocumentHeader('Laboratory Result Report', formatDate(new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Test Results
      </h3>
      ${formatLabResultsTable(results)}
    </div>

    ${generateDocumentFooter(
      technicianInitials || results[0]?.technicianInitials || 'Laboratory Staff',
      '',
      '',
      'Results relate only to the specimen tested.'
    )}
  `;

  return generatePrintableDocument('Laboratory Result Report', content);
}

// Generate Discharge Summary
function generateDischargeSummary(patient: any, discharge: any): string {
  const content = `
    ${generateDocumentHeader('Discharge Summary', formatDate(discharge.dischargeDate || new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
      <div style="background: #f0f9ff; padding: 10px; border-radius: 8px;">
        <strong>Admission Date:</strong> ${formatDate(discharge.admissionDate)}
      </div>
      <div style="background: #d1fae5; padding: 10px; border-radius: 8px;">
        <strong>Discharge Date:</strong> ${formatDate(discharge.dischargeDate)}
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Diagnosis</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
          <strong>Admission:</strong> ${discharge.admissionDiagnosis || 'N/A'}
        </div>
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px;">
          <strong>Discharge:</strong> ${discharge.dischargeDiagnosis || 'N/A'}
        </div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Treatment Summary</h3>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
        ${discharge.treatmentSummary || 'Not documented'}
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Medications on Discharge</h3>
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
        ${discharge.medicationsOnDischarge || 'None'}
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Follow-up Instructions</h3>
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
        ${discharge.followUpInstructions || 'None'}
      </div>
    </div>

    ${generateDocumentFooter(
      discharge.nurseInitials || 'Nursing Staff',
      '',
      discharge.doctorInitials || 'Medical Officer',
      'Patient should present this document at follow-up appointments.'
    )}
  `;

  return generatePrintableDocument('Discharge Summary', content);
}

// Generate Medical Certificate
function generateMedicalCertificate(patient: any, certificate: any): string {
  const content = `
    ${generateDocumentHeader('Medical Certificate', formatDate(certificate.createdAt || new Date().toISOString()))}
    
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="font-size: 14px; color: #6b7280;">This is to certify that</p>
      <h2 style="color: #1e40af; font-size: 24px; margin: 10px 0;">
        ${getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title)}
      </h2>
      <p style="font-size: 12px; color: #6b7280;">
        RUHC Code: ${patient.ruhcCode} | Matric No: ${patient.matricNumber || 'N/A'} | Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
      </p>
    </div>

    ${certificate.type === 'sick_leave' ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 2px solid #f59e0b; text-align: center;">
      <h3 style="color: #92400e; margin-bottom: 15px;">SICK LEAVE CERTIFICATE</h3>
      <p>Has been examined and found to be suffering from <strong>${certificate.diagnosis || 'medical condition'}</strong></p>
      <p style="margin-top: 15px;">The patient is advised to rest for <strong style="color: #dc2626; font-size: 24px;">${certificate.days} day(s)</strong></p>
      <p style="margin-top: 15px; color: #6b7280;">From: <strong>${certificate.startDate ? formatDate(certificate.startDate) : 'N/A'}</strong></p>
    </div>
    ` : `
    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border: 2px solid #10b981; text-align: center;">
      <h3 style="color: #065f46; margin-bottom: 15px;">FITNESS CERTIFICATE</h3>
      <p>Has been examined and found to be <strong style="color: #10b981;">MEDICALLY FIT</strong></p>
      <p style="margin-top: 15px;">${certificate.recommendations || 'No restrictions'}</p>
    </div>
    `}

    ${generateDocumentFooter(
      '',
      '',
      certificate.doctorInitials || 'Medical Officer',
      'This certificate is issued based on medical examination findings.'
    )}
  `;

  return generatePrintableDocument('Medical Certificate', content);
}

// Generate Referral Letter
function generateReferralLetter(patient: any, referral: any): string {
  const content = `
    ${generateDocumentHeader('Referral Letter', formatDate(referral.createdAt || new Date().toISOString()))}
    
    <div style="margin-bottom: 30px;">
      <p style="font-size: 14px;"><strong>To:</strong></p>
      <p style="font-size: 16px; color: #1e40af;">${referral.referredTo}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <p><strong>Re:</strong> Referral of ${getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title)}</p>
      <p style="font-size: 12px; color: #6b7280;">RUHC Code: ${patient.ruhcCode} | Matric No: ${patient.matricNumber || 'N/A'}</p>
    </div>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-bottom: 10px;">Reason for Referral</h3>
      <p>${referral.reason || 'Not specified'}</p>
    </div>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-bottom: 10px;">Provisional Diagnosis</h3>
      <p>${referral.diagnosis || 'Not specified'}</p>
    </div>

    ${referral.treatmentGiven ? `
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-bottom: 10px;">Treatment Given</h3>
      <p>${referral.treatmentGiven}</p>
    </div>
    ` : ''}

    <p style="margin-bottom: 30px;">We would be grateful for your expert management of this patient.</p>

    ${generateDocumentFooter(
      '',
      '',
      referral.doctorInitials || 'Referring Physician',
      'Please bring this referral letter to your appointment.'
    )}
  `;

  return generatePrintableDocument('Referral Letter', content);
}

// Generate Prescription
function generatePrescription(patient: any, prescription: any, doctorName: string, nurseInitials?: string): string {
  const content = `
    ${generateDocumentHeader('Prescription', formatDate(prescription.createdAt || new Date().toISOString()))}
    
    ${formatPatientInfoBlock(patient)}

    <div style="margin-top: 20px;">
      <h3 style="color: #dc2626; font-size: 16px; margin-bottom: 10px;">
        ℹ️ Prescription
      </h3>
      ${prescription.items && prescription.items.length > 0 
        ? formatPrescriptionTable(prescription.items)
        : '<p style="color: #6b7280; font-style: italic;">No medications prescribed.</p>'
      }
    </div>

    ${patient.allergies ? `
    <div style="margin-top: 20px; background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
      <strong style="color: #dc2626;">⚠️ KNOWN ALLERGIES:</strong> ${patient.allergies}
    </div>
    ` : ''}

    ${generateDocumentFooter(
      nurseInitials || '',
      '',
      doctorName || 'Prescribing Physician',
      'This prescription is valid for 30 days.'
    )}
  `;

  return generatePrintableDocument('Prescription', content);
}

// API Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, data } = body as { documentType: DocumentType; data: any };

    let htmlContent = '';

    switch (documentType) {
      case 'patient_registration':
        htmlContent = generatePatientRegistration(data.patient, data.nurseInitials);
        break;
      case 'vital_signs_record':
        htmlContent = generateVitalSignsRecord(data.patient, data.vitals || [], data.nurseInitials);
        break;
      case 'nurse_notes':
        htmlContent = generateNursingNotes(data.patient, data.vitals || [], data.medications || [], data.notes, data.nurseInitials);
        break;
      case 'doctor_consultation':
        htmlContent = generateDoctorConsultation(data.consultation, data.patient);
        break;
      case 'medication_administration':
        htmlContent = generateMAR(data.patient, data.medications || [], data.nurseInitials);
        break;
      case 'lab_result':
        htmlContent = generateLabResult(data.patient, data.results || [], data.technicianInitials);
        break;
      case 'discharge_summary':
        htmlContent = generateDischargeSummary(data.patient, data.discharge);
        break;
      case 'medical_certificate':
        htmlContent = generateMedicalCertificate(data.patient, data.certificate);
        break;
      case 'referral_letter':
        htmlContent = generateReferralLetter(data.patient, data.referral);
        break;
      case 'prescription':
        htmlContent = generatePrescription(data.patient, data.prescription, data.doctorName, data.nurseInitials);
        break;
      default:
        return NextResponse.json({ error: 'Unknown document type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      html: htmlContent,
      title: DOCUMENT_TITLES[documentType]
    });

  } catch (error: any) {
    console.error('Document generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate document',
      details: error.message 
    }, { status: 500 });
  }
}
