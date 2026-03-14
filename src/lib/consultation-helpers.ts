// SIMPLIFIED CONSULTATION HELPERS
// Clear workflow: Send → Review → Route

import { Patient, User } from '@/app/hms/page'

// ============== TYPES ==============
export type ConsultationStatus = 'pending' | 'in_progress' | 'completed' | 'routed'

export interface SimpleConsultation {
  id: string
  patientId: string
  patient?: Patient
  
  // Who sent
  senderId?: string
  senderName?: string
  senderRole?: string
  
  // Doctor handling
  doctorId?: string
  doctorName?: string
  
  // The reason for consultation
  chiefComplaint: string
  notes?: string
  
  // Status
  status: ConsultationStatus
  
  // Where routed after doctor review
  referredTo?: 'nurse' | 'lab' | 'pharmacy' | 'records'
  
  // Timestamps
  createdAt: string
  updatedAt?: string
  completedAt?: string
}

// ============== SIMPLE CONSULTATION API ==============

const API_BASE = '/api/consultations'

// Create a new consultation (Nurse/Records sends to Doctor)
export async function sendToDoctor(data: {
  patientId: string
  patient?: Patient
  senderId?: string
  senderName?: string
  senderRole?: string
  doctorId?: string  // Optional - if not specified, goes to all doctors
  doctorName?: string
  chiefComplaint: string
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await response.json()
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get consultations (filtered by status, doctor, patient)
export async function getConsultations(filters?: {
  status?: string
  doctorId?: string
  patientId?: string
}): Promise<{ success: boolean; consultations?: SimpleConsultation[]; error?: string }> {
  try {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.doctorId) params.set('doctorId', filters.doctorId)
    if (filters?.patientId) params.set('patientId', filters.patientId)
    
    const response = await fetch(`${API_BASE}?${params.toString()}`)
    return await response.json()
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update consultation status
export async function updateConsultation(data: {
  id: string
  status?: ConsultationStatus
  doctorId?: string
  doctorName?: string
  referredTo?: string
  notes?: string
  completedAt?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await response.json()
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Doctor starts reviewing a consultation
export async function startReview(consultationId: string, doctor: User): Promise<{ success: boolean }> {
  return updateConsultation({
    id: consultationId,
    status: 'in_progress',
    doctorId: doctor.id,
    doctorName: doctor.name
  })
}

// Doctor completes consultation and routes patient
export async function completeAndRoute(
  consultationId: string, 
  routeTo: 'nurse' | 'lab' | 'pharmacy' | 'records'
): Promise<{ success: boolean }> {
  return updateConsultation({
    id: consultationId,
    status: 'routed',
    referredTo: routeTo,
    completedAt: true
  })
}

// Doctor completes without routing (discharge)
export async function completeConsultation(consultationId: string): Promise<{ success: boolean }> {
  return updateConsultation({
    id: consultationId,
    status: 'completed',
    completedAt: true
  })
}

// ============== HELPER FUNCTIONS ==============

// Get status badge color
export function getStatusColor(status: ConsultationStatus): string {
  switch (status) {
    case 'pending': return 'bg-yellow-500'
    case 'in_progress': return 'bg-blue-500'
    case 'completed': return 'bg-green-500'
    case 'routed': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

// Get status display text
export function getStatusText(status: ConsultationStatus): string {
  switch (status) {
    case 'pending': return 'Waiting for Doctor'
    case 'in_progress': return 'With Doctor'
    case 'completed': return 'Completed'
    case 'routed': return 'Routed to Department'
    default: return 'Unknown'
  }
}

// Get route destination display text
export function getRouteText(routeTo?: string): string {
  switch (routeTo) {
    case 'nurse': return 'Nurse Station'
    case 'lab': return 'Laboratory'
    case 'pharmacy': return 'Pharmacy'
    case 'records': return 'Records'
    default: return 'Not Routed'
  }
}

// Format consultation for display
export function formatConsultation(c: SimpleConsultation): {
  id: string
  patientName: string
  patientHospitalNumber: string
  statusText: string
  statusColor: string
  doctorName: string
  chiefComplaint: string
  createdAt: string
  routeText: string
} {
  const patient = c.patient
  return {
    id: c.id,
    patientName: patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
    patientHospitalNumber: patient?.hospitalNumber || 'N/A',
    statusText: getStatusText(c.status),
    statusColor: getStatusColor(c.status),
    doctorName: c.doctorName || 'Any Available Doctor',
    chiefComplaint: c.chiefComplaint || 'No complaint specified',
    createdAt: new Date(c.createdAt).toLocaleString(),
    routeText: getRouteText(c.referredTo)
  }
}
