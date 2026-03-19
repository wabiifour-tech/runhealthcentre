/**
 * Patient Repository
 * 
 * Handles all database operations for patients
 */

import { BaseRepository, PaginatedResult, FilterOptions, PaginationOptions } from '@/repositories/base.repository'
import { patients } from '@/generated/prisma'

export type Patient = patients

export interface PatientCreateInput {
  id?: string
  hospitalNumber?: string
  ruhcCode?: string
  matricNumber?: string
  patientType?: string
  firstName: string
  lastName: string
  middleName?: string
  title?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  genotype?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  lga?: string
  nationality?: string
  religion?: string
  occupation?: string
  maritalStatus?: string
  nokName?: string
  nokRelationship?: string
  nokPhone?: string
  nokAddress?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  insuranceNumber?: string
  insuranceProvider?: string
  allergies?: string
  chronicConditions?: string
  currentMedications?: string
  currentUnit?: string
  bedNumber?: number
  admissionDate?: Date
  dischargeDate?: Date
  isActive?: boolean
  registeredAt?: Date
  registeredBy?: string
  lastEditedBy?: string
  lastEditedAt?: Date
}

export type PatientUpdateInput = Partial<PatientCreateInput>

export interface PatientSearchOptions extends FilterOptions, PaginationOptions {
  search?: string
  patientType?: string
  gender?: string
  bloodGroup?: string
  isActive?: boolean
}

export class PatientRepository extends BaseRepository<Patient, PatientCreateInput, PatientUpdateInput> {
  constructor() {
    super('patients')
  }

  /**
   * Generate a unique RUHC code
   */
  async generateRuhcCode(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.count()
    const sequence = (count + 1).toString().padStart(4, '0')
    return `RUHC-${year}-${sequence}`
  }

  /**
   * Find patient by RUHC code
   */
  async findByRuhcCode(ruhcCode: string): Promise<Patient | null> {
    return await this.findOne({ ruhcCode })
  }

  /**
   * Find patient by hospital number
   */
  async findByHospitalNumber(hospitalNumber: string): Promise<Patient | null> {
    return await this.findOne({ hospitalNumber })
  }

  /**
   * Find patient by matric number
   */
  async findByMatricNumber(matricNumber: string): Promise<Patient | null> {
    return await this.findOne({ matricNumber })
  }

  /**
   * Search patients by name, RUHC code, hospital number, or matric number
   */
  async search(options: PatientSearchOptions): Promise<PaginatedResult<Patient>> {
    const { search, patientType, gender, bloodGroup, isActive, page = 1, limit = 20, orderBy } = options

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        { ruhcCode: { contains: search, mode: 'insensitive' } },
        { hospitalNumber: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (patientType) {
      where.patientType = patientType
    }

    if (gender) {
      where.gender = gender
    }

    if (bloodGroup) {
      where.bloodGroup = bloodGroup
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    return await this.findPaginated({
      where,
      page,
      limit,
      orderBy: orderBy || { registeredAt: 'desc' }
    })
  }

  /**
   * Get patients with upcoming appointments
   */
  async getPatientsWithUpcomingAppointments(): Promise<Patient[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const result = await this.$queryRaw<Patient>(`
      SELECT DISTINCT p.*
      FROM patients p
      JOIN appointments a ON a."patientId" = p.id
      WHERE a."appointmentDate" >= $1
      AND a.status = 'scheduled'
      ORDER BY a."appointmentDate" ASC
    `, today.toISOString())
    
    return Array.isArray(result) ? result : []
  }

  /**
   * Get patients with active allergies
   */
  async getPatientsWithAllergies(): Promise<Patient[]> {
    return await this.findMany({
      where: {
        allergies: { not: null },
        isActive: true
      },
      orderBy: { lastName: 'asc' }
    })
  }

  /**
   * Get patients currently admitted
   */
  async getAdmittedPatients(): Promise<Patient[]> {
    return await this.findMany({
      where: {
        currentUnit: { not: null },
        dischargeDate: null,
        isActive: true
      },
      orderBy: { admissionDate: 'desc' }
    })
  }

  /**
   * Get patient statistics
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    admitted: number
    byType: Record<string, number>
    byGender: Record<string, number>
  }> {
    const [total, active, admitted] = await Promise.all([
      this.count(),
      this.count({ isActive: true }),
      this.count({ currentUnit: { not: null }, dischargeDate: null })
    ])

    // Get counts by patient type
    const byTypeRows = await this.$queryRaw<{ patientType: string; count: bigint }>(`
      SELECT "patientType", COUNT(*) as count
      FROM patients
      WHERE "isActive" = true
      GROUP BY "patientType"
    `)
    
    const byType: Record<string, number> = {}
    if (Array.isArray(byTypeRows)) {
      for (const row of byTypeRows) {
        if (row.patientType) {
          byType[row.patientType] = Number(row.count)
        }
      }
    }

    // Get counts by gender
    const byGenderRows = await this.$queryRaw<{ gender: string; count: bigint }>(`
      SELECT gender, COUNT(*) as count
      FROM patients
      WHERE "isActive" = true
      GROUP BY gender
    `)
    
    const byGender: Record<string, number> = {}
    if (Array.isArray(byGenderRows)) {
      for (const row of byGenderRows) {
        if (row.gender) {
          byGender[row.gender] = Number(row.count)
        }
      }
    }

    return { total, active, admitted, byType, byGender }
  }
}

// Singleton instance
export const patientRepository = new PatientRepository()
