/**
 * Consultation Service
 * 
 * Business logic for consultation management
 */

import { BaseService, ServiceContext } from '@/services/base.service'
import { ConsultationRepository, Consultation, ConsultationCreateInput, ConsultationUpdateInput, ConsultationSearchOptions, consultationRepository } from '@/modules/consultations/repositories/consultation.repository'
import { patientRepository } from '@/modules/patients/repositories/patient.repository'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'

const logger = createLogger('ConsultationService')

export interface CreateConsultationData extends ConsultationCreateInput {
  generateId?: boolean
}

export class ConsultationService extends BaseService<Consultation, CreateConsultationData, ConsultationUpdateInput> {
  constructor() {
    super('Consultation', consultationRepository)
  }

  /**
   * Generate ID and set defaults before creating
   */
  protected async beforeCreate(data: CreateConsultationData, context?: ServiceContext): Promise<ConsultationCreateInput> {
    // Get patient details for denormalization
    let patientData = data.patient
    if (data.patientId && !patientData) {
      const patient = await patientRepository.findById(data.patientId)
      if (patient) {
        patientData = {
          id: patient.id,
          ruhcCode: patient.ruhcCode,
          firstName: patient.firstName,
          lastName: patient.lastName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies
        }
      }
    }

    return {
      ...data,
      id: data.id || nanoid(),
      patient: patientData,
      status: data.status || 'pending',
      createdAt: data.createdAt || new Date()
    }
  }

  /**
   * Log consultation creation
   */
  protected async afterCreate(result: Consultation, context?: ServiceContext): Promise<void> {
    logger.info('Consultation created', {
      consultationId: result.id,
      patientId: result.patientId,
      createdBy: context?.userId
    })
  }

  /**
   * Search consultations
   */
  async search(options: ConsultationSearchOptions, context?: ServiceContext): Promise<{
    data: Consultation[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    logger.debug('Searching consultations', { options, userId: context?.userId })
    return await consultationRepository.search(options)
  }

  /**
   * Get pending consultations queue
   */
  async getPendingQueue(referredTo?: string, context?: ServiceContext): Promise<Consultation[]> {
    logger.debug('Getting pending consultations', { referredTo, userId: context?.userId })
    return await consultationRepository.getPendingConsultations(referredTo)
  }

  /**
   * Get consultations by patient
   */
  async getByPatientId(patientId: string, context?: ServiceContext): Promise<Consultation[]> {
    logger.debug('Getting patient consultations', { patientId, userId: context?.userId })
    
    if (context?.userId) {
      await this.auditLog('VIEW_PATIENT_HISTORY', context, { patientId })
    }
    
    return await consultationRepository.findByPatientId(patientId)
  }

  /**
   * Get consultations by doctor
   */
  async getByDoctorId(doctorId: string, context?: ServiceContext): Promise<Consultation[]> {
    return await consultationRepository.findByDoctorId(doctorId)
  }

  /**
   * Get consultation statistics
   */
  async getStatistics(doctorId?: string, context?: ServiceContext): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    today: number
    thisWeek: number
    thisMonth: number
  }> {
    return await consultationRepository.getStatistics(doctorId)
  }

  /**
   * Start consultation (assign to doctor)
   */
  async startConsultation(id: string, doctorId: string, doctorName: string, context?: ServiceContext): Promise<Consultation> {
    logger.info('Starting consultation', { consultationId: id, doctorId, userId: context?.userId })
    
    const consultation = await consultationRepository.assignToDoctor(id, doctorId, doctorName)
    
    if (context?.userId) {
      await this.auditLog('START_CONSULTATION', context, { consultationId: id, doctorId })
    }
    
    return consultation
  }

  /**
   * Complete consultation
   */
  async completeConsultation(id: string, data: Partial<ConsultationCreateInput>, context?: ServiceContext): Promise<Consultation> {
    logger.info('Completing consultation', { consultationId: id, userId: context?.userId })
    
    const consultation = await consultationRepository.complete(id, data)
    
    if (context?.userId) {
      await this.auditLog('COMPLETE_CONSULTATION', context, { 
        consultationId: id, 
        diagnosis: data.finalDiagnosis 
      })
    }
    
    return consultation
  }

  /**
   * Route consultation to another department
   */
  async routeConsultation(id: string, referredTo: string, notes: string, context?: ServiceContext): Promise<Consultation> {
    logger.info('Routing consultation', { consultationId: id, referredTo, userId: context?.userId })
    
    const consultation = await consultationRepository.route(id, referredTo, notes)
    
    if (context?.userId) {
      await this.auditLog('ROUTE_CONSULTATION', context, { 
        consultationId: id, 
        referredTo,
        notes
      })
    }
    
    return consultation
  }

  /**
   * Send back consultation for review
   */
  async sendBack(id: string, sendBackTo: string, notes: string, context?: ServiceContext): Promise<Consultation> {
    logger.info('Sending back consultation', { consultationId: id, sendBackTo, userId: context?.userId })
    
    const consultation = await consultationRepository.update(id, {
      sendBackTo: { role: sendBackTo },
      sendBackNotes: notes,
      status: 'sent_back'
    })
    
    if (context?.userId) {
      await this.auditLog('SEND_BACK_CONSULTATION', context, { 
        consultationId: id, 
        sendBackTo,
        notes
      })
    }
    
    return consultation
  }

  /**
   * Validate consultation creation
   */
  async validateCreate(data: CreateConsultationData, context?: ServiceContext): Promise<void> {
    if (!data.patientId && !data.patient) {
      throw new Error('Patient ID or patient data is required')
    }

    if (data.patientId) {
      const patient = await patientRepository.findById(data.patientId)
      if (!patient) {
        throw new Error('Patient not found')
      }
    }
  }
}

// Singleton instance
export const consultationService = new ConsultationService()
