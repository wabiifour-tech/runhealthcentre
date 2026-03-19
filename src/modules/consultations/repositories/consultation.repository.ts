/**
 * Consultation Repository
 * 
 * Handles all database operations for consultations
 */

import { BaseRepository, PaginatedResult, FilterOptions, PaginationOptions } from '@/repositories/base.repository'
import { consultations } from '@/generated/prisma'

export type Consultation = consultations

export interface ConsultationCreateInput {
  id?: string
  patientId?: string
  patient?: any
  doctorId?: string
  doctorName?: string
  status?: string
  chiefComplaint?: string
  historyOfPresentIllness?: string
  pastMedicalHistory?: string
  signsAndSymptoms?: string
  bloodPressureSystolic?: string
  bloodPressureDiastolic?: string
  temperature?: string
  pulse?: string
  respiratoryRate?: string
  weight?: string
  height?: string
  oxygenSaturation?: string
  generalExamination?: string
  systemExamination?: string
  investigationsRequested?: any
  scanRequested?: any
  scanFindings?: string
  provisionalDiagnosis?: string
  finalDiagnosis?: string
  treatmentPlan?: string
  prescriptions?: any
  referredTo?: string
  referralTo?: string
  referralNotes?: string
  sendBackTo?: any
  sendBackNotes?: string
  sentByNurseInitials?: string
  sentAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type ConsultationUpdateInput = Partial<ConsultationCreateInput>

export interface ConsultationSearchOptions extends FilterOptions, PaginationOptions {
  patientId?: string
  doctorId?: string
  status?: string
  referredTo?: string
  dateFrom?: Date
  dateTo?: Date
}

export class ConsultationRepository extends BaseRepository<Consultation, ConsultationCreateInput, ConsultationUpdateInput> {
  constructor() {
    super('consultations')
  }

  /**
   * Get consultations by patient ID
   */
  async findByPatientId(patientId: string, options?: PaginationOptions): Promise<Consultation[]> {
    return await this.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      ...options
    })
  }

  /**
   * Get consultations by doctor ID
   */
  async findByDoctorId(doctorId: string, options?: PaginationOptions): Promise<Consultation[]> {
    return await this.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      ...options
    })
  }

  /**
   * Get pending consultations (queue)
   */
  async getPendingConsultations(referredTo?: string): Promise<Consultation[]> {
    const where: any = {
      status: { in: ['pending', 'in_progress'] }
    }
    
    if (referredTo) {
      where.referredTo = referredTo
    }
    
    return await this.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    })
  }

  /**
   * Get completed consultations for a date range
   */
  async getCompletedByDateRange(from: Date, to: Date): Promise<Consultation[]> {
    return await this.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: from,
          lte: to
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Search consultations with filters
   */
  async search(options: ConsultationSearchOptions): Promise<PaginatedResult<Consultation>> {
    const { 
      patientId, 
      doctorId, 
      status, 
      referredTo, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20, 
      orderBy,
      where: extraWhere 
    } = options

    // Build where clause
    const where: any = { ...extraWhere }
    
    if (patientId) {
      where.patientId = patientId
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (status) {
      where.status = status
    }

    if (referredTo) {
      where.referredTo = referredTo
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    return await this.findPaginated({
      where,
      page,
      limit,
      orderBy: orderBy || { createdAt: 'desc' }
    })
  }

  /**
   * Get consultation statistics
   */
  async getStatistics(doctorId?: string): Promise<{
    total: number
    pending: number
    inProgress: number
    completed: number
    today: number
    thisWeek: number
    thisMonth: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const baseWhere = doctorId ? { doctorId } : {}

    const [total, pending, inProgress, completed, todayCount, weekCount, monthCount] = await Promise.all([
      this.count(baseWhere),
      this.count({ ...baseWhere, status: 'pending' }),
      this.count({ ...baseWhere, status: 'in_progress' }),
      this.count({ ...baseWhere, status: 'completed' }),
      this.count({ ...baseWhere, createdAt: { gte: today } }),
      this.count({ ...baseWhere, createdAt: { gte: weekAgo } }),
      this.count({ ...baseWhere, createdAt: { gte: monthAgo } })
    ])

    return { total, pending, inProgress, completed, today: todayCount, thisWeek: weekCount, thisMonth: monthCount }
  }

  /**
   * Update consultation status
   */
  async updateStatus(id: string, status: string): Promise<Consultation> {
    return await this.update(id, { status })
  }

  /**
   * Assign consultation to doctor
   */
  async assignToDoctor(id: string, doctorId: string, doctorName: string): Promise<Consultation> {
    return await this.update(id, { 
      doctorId, 
      doctorName,
      status: 'in_progress'
    })
  }

  /**
   * Complete consultation
   */
  async complete(id: string, data: Partial<ConsultationCreateInput>): Promise<Consultation> {
    return await this.update(id, {
      ...data,
      status: 'completed'
    })
  }

  /**
   * Route consultation to another department
   */
  async route(id: string, referredTo: string, notes?: string): Promise<Consultation> {
    return await this.update(id, {
      referredTo,
      referralNotes: notes,
      sentAt: new Date()
    })
  }
}

// Singleton instance
export const consultationRepository = new ConsultationRepository()
