/**
 * Vitals Repository
 * 
 * Handles all database operations for vital signs
 */

import { BaseRepository, PaginatedResult, FilterOptions, PaginationOptions } from '@/repositories/base.repository'
import { vital_signs } from '@/generated/prisma'

export type VitalSigns = vital_signs

export interface VitalSignsCreateInput {
  id?: string
  patientId?: string
  patient?: any
  recordedBy?: string
  bloodPressureSystolic?: string
  bloodPressureDiastolic?: string
  temperature?: string
  pulse?: string
  respiratoryRate?: string
  weight?: string
  height?: string
  oxygenSaturation?: string
  painScore?: string
  notes?: string
  recordedAt?: Date
}

export type VitalSignsUpdateInput = Partial<VitalSignsCreateInput>

export interface VitalSignsSearchOptions extends FilterOptions, PaginationOptions {
  patientId?: string
  recordedBy?: string
  dateFrom?: Date
  dateTo?: Date
}

export class VitalSignsRepository extends BaseRepository<VitalSigns, VitalSignsCreateInput, VitalSignsUpdateInput> {
  constructor() {
    super('vital_signs')
  }

  /**
   * Get vitals by patient ID
   */
  async findByPatientId(patientId: string, options?: PaginationOptions): Promise<VitalSigns[]> {
    return await this.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      ...options
    })
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestForPatient(patientId: string): Promise<VitalSigns | null> {
    return await this.findOne(
      { patientId },
      { orderBy: { recordedAt: 'desc' } }
    )
  }

  /**
   * Get vitals recorded by a specific user
   */
  async findByRecorder(recordedBy: string, options?: PaginationOptions): Promise<VitalSigns[]> {
    return await this.findMany({
      where: { recordedBy },
      orderBy: { recordedAt: 'desc' },
      ...options
    })
  }

  /**
   * Search vitals with filters
   */
  async search(options: VitalSignsSearchOptions): Promise<PaginatedResult<VitalSigns>> {
    const { patientId, recordedBy, dateFrom, dateTo, page = 1, limit = 20, orderBy, where: extraWhere } = options

    const where: any = { ...extraWhere }
    
    if (patientId) where.patientId = patientId
    if (recordedBy) where.recordedBy = recordedBy
    
    if (dateFrom || dateTo) {
      where.recordedAt = {}
      if (dateFrom) where.recordedAt.gte = dateFrom
      if (dateTo) where.recordedAt.lte = dateTo
    }

    return await this.findPaginated({
      where,
      page,
      limit,
      orderBy: orderBy || { recordedAt: 'desc' }
    })
  }

  /**
   * Get vitals statistics for a patient
   */
  async getPatientStats(patientId: string): Promise<{
    total: number
    avgSystolic: number | null
    avgDiastolic: number | null
    avgPulse: number | null
    avgTemperature: number | null
    avgWeight: number | null
    latestWeight: number | null
    latestHeight: number | null
  }> {
    const vitals = await this.findByPatientId(patientId)
    
    if (vitals.length === 0) {
      return {
        total: 0,
        avgSystolic: null,
        avgDiastolic: null,
        avgPulse: null,
        avgTemperature: null,
        avgWeight: null,
        latestWeight: null,
        latestHeight: null
      }
    }
    
    // Calculate averages
    const systolics = vitals.filter(v => v.bloodPressureSystolic).map(v => parseFloat(v.bloodPressureSystolic!))
    const diastolics = vitals.filter(v => v.bloodPressureDiastolic).map(v => parseFloat(v.bloodPressureDiastolic!))
    const pulses = vitals.filter(v => v.pulse).map(v => parseFloat(v.pulse!))
    const temps = vitals.filter(v => v.temperature).map(v => parseFloat(v.temperature!))
    const weights = vitals.filter(v => v.weight).map(v => parseFloat(v.weight!))
    
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
    
    return {
      total: vitals.length,
      avgSystolic: avg(systolics),
      avgDiastolic: avg(diastolics),
      avgPulse: avg(pulses),
      avgTemperature: avg(temps),
      avgWeight: avg(weights),
      latestWeight: vitals[0]?.weight ? parseFloat(vitals[0].weight) : null,
      latestHeight: vitals[0]?.height ? parseFloat(vitals[0].height) : null
    }
  }

  /**
   * Get vitals recorded today
   */
  async getTodayVitals(): Promise<VitalSigns[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return await this.findMany({
      where: {
        recordedAt: { gte: today }
      },
      orderBy: { recordedAt: 'desc' }
    })
  }
}

// Singleton instance
export const vitalSignsRepository = new VitalSignsRepository()
