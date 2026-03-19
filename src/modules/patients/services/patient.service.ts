/**
 * Patient Service
 * 
 * Business logic for patient management
 */

import { BaseService, ServiceContext } from '@/services/base.service'
import { PatientRepository, Patient, PatientCreateInput, PatientUpdateInput, PatientSearchOptions, patientRepository } from '@/modules/patients/repositories/patient.repository'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'

const logger = createLogger('PatientService')

export interface CreatePatientData extends PatientCreateInput {
  generateCode?: boolean
}

export interface UpdatePatientData extends PatientUpdateInput {
  reason?: string
}

export class PatientService extends BaseService<Patient, CreatePatientData, UpdatePatientData> {
  constructor() {
    super('Patient', patientRepository)
  }

  /**
   * Generate unique IDs and codes before creating
   */
  protected async beforeCreate(data: CreatePatientData, context?: ServiceContext): Promise<PatientCreateInput> {
    const { generateCode = true, ...rest } = data
    
    const patientData: PatientCreateInput = {
      ...rest,
      id: rest.id || nanoid(),
      isActive: rest.isActive ?? true,
      registeredAt: rest.registeredAt || new Date(),
      registeredBy: rest.registeredBy || context?.userId
    }

    // Generate RUHC code if needed
    if (generateCode && !patientData.ruhcCode) {
      patientData.ruhcCode = await patientRepository.generateRuhcCode()
    }

    return patientData
  }

  /**
   * Log patient creation
   */
  protected async afterCreate(result: Patient, context?: ServiceContext): Promise<void> {
    logger.info('Patient created', {
      patientId: result.id,
      ruhcCode: result.ruhcCode,
      name: `${result.firstName} ${result.lastName}`,
      createdBy: context?.userId
    })
  }

  /**
   * Track last edit
   */
  protected async beforeUpdate(
    id: string, 
    data: UpdatePatientData, 
    existing: Patient, 
    context?: ServiceContext
  ): Promise<PatientUpdateInput> {
    const { reason, ...rest } = data
    
    return {
      ...rest,
      lastEditedBy: context?.userId,
      lastEditedAt: new Date()
    }
  }

  /**
   * Log patient update
   */
  protected async afterUpdate(result: Patient, previous: Patient, context?: ServiceContext): Promise<void> {
    logger.info('Patient updated', {
      patientId: result.id,
      ruhcCode: result.ruhcCode,
      updatedBy: context?.userId
    })
  }

  /**
   * Check for existing patient before deletion
   */
  protected async beforeDelete(id: string, existing: Patient, context?: ServiceContext): Promise<void> {
    // Check for active consultations
    const hasActiveConsultations = await this.hasActiveRecords(id, 'consultations')
    if (hasActiveConsultations) {
      throw new Error('Cannot delete patient with active consultations. Please complete or cancel consultations first.')
    }

    // Check for pending prescriptions
    const hasPendingPrescriptions = await this.hasActiveRecords(id, 'prescriptions')
    if (hasPendingPrescriptions) {
      throw new Error('Cannot delete patient with pending prescriptions.')
    }
  }

  /**
   * Check if patient has active records in a table
   */
  private async hasActiveRecords(patientId: string, table: string): Promise<boolean> {
    try {
      const result = await patientRepository.$queryRaw<{ count: bigint }>(`
        SELECT COUNT(*) as count FROM ${table} 
        WHERE "patientId" = $1 
        AND status NOT IN ('completed', 'cancelled', 'dispensed')
      `, patientId)
      
      return Number(result[0]?.count || 0) > 0
    } catch {
      return false
    }
  }

  /**
   * Search patients with pagination
   */
  async search(options: PatientSearchOptions, context?: ServiceContext): Promise<{
    data: Patient[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    logger.debug('Searching patients', { options, userId: context?.userId })
    return await patientRepository.search(options)
  }

  /**
   * Get patient by RUHC code
   */
  async getByRuhcCode(ruhcCode: string, context?: ServiceContext): Promise<Patient | null> {
    logger.debug('Getting patient by RUHC code', { ruhcCode, userId: context?.userId })
    const patient = await patientRepository.findByRuhcCode(ruhcCode)
    
    if (patient && context?.userId) {
      await this.auditLog('VIEW', context, { entityId: patient.id, ruhcCode })
    }
    
    return patient
  }

  /**
   * Get patient by hospital number
   */
  async getByHospitalNumber(hospitalNumber: string, context?: ServiceContext): Promise<Patient | null> {
    return await patientRepository.findByHospitalNumber(hospitalNumber)
  }

  /**
   * Get patient by matric number (for students/staff)
   */
  async getByMatricNumber(matricNumber: string, context?: ServiceContext): Promise<Patient | null> {
    return await patientRepository.findByMatricNumber(matricNumber)
  }

  /**
   * Check if patient exists with given identifiers
   */
  async checkDuplicate(data: { 
    ruhcCode?: string
    hospitalNumber?: string 
    matricNumber?: string 
    email?: string 
    phone?: string 
  }, excludeId?: string): Promise<{
    isDuplicate: boolean
    fields: string[]
    existingPatient?: Patient
  }> {
    const fields: string[] = []
    let existingPatient: Patient | null = null

    if (data.ruhcCode) {
      const patient = await patientRepository.findByRuhcCode(data.ruhcCode)
      if (patient && patient.id !== excludeId) {
        fields.push('RUHC Code')
        existingPatient = patient
      }
    }

    if (data.hospitalNumber) {
      const patient = await patientRepository.findByHospitalNumber(data.hospitalNumber)
      if (patient && patient.id !== excludeId) {
        fields.push('Hospital Number')
        existingPatient = patient
      }
    }

    if (data.matricNumber) {
      const patient = await patientRepository.findByMatricNumber(data.matricNumber)
      if (patient && patient.id !== excludeId) {
        fields.push('Matric Number')
        existingPatient = patient
      }
    }

    return {
      isDuplicate: fields.length > 0,
      fields,
      existingPatient: existingPatient || undefined
    }
  }

  /**
   * Get patient statistics
   */
  async getStatistics(context?: ServiceContext): Promise<{
    total: number
    active: number
    admitted: number
    byType: Record<string, number>
    byGender: Record<string, number>
  }> {
    return await patientRepository.getStatistics()
  }

  /**
   * Get patients with allergies
   */
  async getPatientsWithAllergies(context?: ServiceContext): Promise<Patient[]> {
    return await patientRepository.getPatientsWithAllergies()
  }

  /**
   * Get currently admitted patients
   */
  async getAdmittedPatients(context?: ServiceContext): Promise<Patient[]> {
    return await patientRepository.getAdmittedPatients()
  }

  /**
   * Validate patient creation data
   */
  async validateCreate(data: CreatePatientData, context?: ServiceContext): Promise<void> {
    // Check for duplicate identifiers
    const duplicate = await this.checkDuplicate({
      ruhcCode: data.ruhcCode,
      hospitalNumber: data.hospitalNumber,
      matricNumber: data.matricNumber
    })

    if (duplicate.isDuplicate) {
      throw new Error(`Patient already exists with same ${duplicate.fields.join(', ')}`)
    }

    // Validate patient type specific fields
    if (data.patientType === 'Student' && !data.matricNumber) {
      logger.warn('Student patient without matric number', { data })
    }
  }

  /**
   * Validate patient update data
   */
  async validateUpdate(id: string, data: UpdatePatientData, context?: ServiceContext): Promise<void> {
    // Check for duplicate identifiers (excluding current patient)
    const duplicate = await this.checkDuplicate({
      ruhcCode: data.ruhcCode,
      hospitalNumber: data.hospitalNumber,
      matricNumber: data.matricNumber
    }, id)

    if (duplicate.isDuplicate) {
      throw new Error(`Another patient exists with same ${duplicate.fields.join(', ')}`)
    }
  }
}

// Singleton instance
export const patientService = new PatientService()
