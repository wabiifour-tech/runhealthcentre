/**
 * Vitals Service
 * 
 * Business logic for vital signs management
 */

import { BaseService, ServiceContext } from '@/services/base.service'
import { VitalSignsRepository, VitalSigns, VitalSignsCreateInput, VitalSignsUpdateInput, VitalSignsSearchOptions, vitalSignsRepository } from '@/modules/triage/repositories/vitals.repository'
import { patientRepository } from '@/modules/patients/repositories/patient.repository'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'

const logger = createLogger('VitalsService')

export interface CreateVitalsData extends VitalSignsCreateInput {
  checkAlerts?: boolean
}

export interface VitalAlert {
  type: 'critical' | 'warning'
  vital: string
  value: string
  message: string
}

export class VitalsService extends BaseService<VitalSigns, CreateVitalsData, VitalSignsUpdateInput> {
  constructor() {
    super('VitalSigns', vitalSignsRepository)
  }

  /**
   * Enrich patient data and check alerts before creating
   */
  protected async beforeCreate(data: CreateVitalsData, context?: ServiceContext): Promise<VitalSignsCreateInput> {
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
          dateOfBirth: patient.dateOfBirth
        }
      }
    }

    return {
      ...data,
      id: data.id || nanoid(),
      patient: patientData,
      recordedBy: data.recordedBy || context?.userId,
      recordedAt: data.recordedAt || new Date()
    }
  }

  /**
   * Check for vital sign alerts after creation
   */
  protected async afterCreate(result: VitalSigns, context?: ServiceContext): Promise<void> {
    logger.info('Vitals recorded', {
      vitalsId: result.id,
      patientId: result.patientId,
      recordedBy: context?.userId
    })

    // Check for alerts
    const alerts = this.checkAlerts(result)
    if (alerts.length > 0 && context) {
      await this.createVitalAlerts(result, alerts, context)
    }
  }

  /**
   * Get vitals by patient
   */
  async getByPatientId(patientId: string, context?: ServiceContext): Promise<VitalSigns[]> {
    return await vitalSignsRepository.findByPatientId(patientId)
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestForPatient(patientId: string, context?: ServiceContext): Promise<VitalSigns | null> {
    return await vitalSignsRepository.getLatestForPatient(patientId)
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(patientId: string, context?: ServiceContext): Promise<{
    total: number
    avgSystolic: number | null
    avgDiastolic: number | null
    avgPulse: number | null
    avgTemperature: number | null
    avgWeight: number | null
    latestWeight: number | null
    latestHeight: number | null
  }> {
    return await vitalSignsRepository.getPatientStats(patientId)
  }

  /**
   * Search vitals with filters
   */
  async search(options: VitalSignsSearchOptions, context?: ServiceContext): Promise<{
    data: VitalSigns[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    return await vitalSignsRepository.search(options)
  }

  /**
   * Get today's vitals
   */
  async getTodayVitals(context?: ServiceContext): Promise<VitalSigns[]> {
    return await vitalSignsRepository.getTodayVitals()
  }

  /**
   * Check for abnormal vital signs
   */
  checkAlerts(vitals: VitalSigns): VitalAlert[] {
    const alerts: VitalAlert[] = []

    // Blood pressure alerts
    const systolic = vitals.bloodPressureSystolic ? parseInt(vitals.bloodPressureSystolic) : null
    const diastolic = vitals.bloodPressureDiastolic ? parseInt(vitals.bloodPressureDiastolic) : null

    if (systolic) {
      if (systolic >= 180) {
        alerts.push({ type: 'critical', vital: 'systolic', value: String(systolic), message: 'Hypertensive crisis - immediate attention required' })
      } else if (systolic >= 140) {
        alerts.push({ type: 'warning', vital: 'systolic', value: String(systolic), message: 'High blood pressure detected' })
      } else if (systolic < 90) {
        alerts.push({ type: 'warning', vital: 'systolic', value: String(systolic), message: 'Low blood pressure detected' })
      }
    }

    if (diastolic) {
      if (diastolic >= 120) {
        alerts.push({ type: 'critical', vital: 'diastolic', value: String(diastolic), message: 'Hypertensive crisis - immediate attention required' })
      } else if (diastolic >= 90) {
        alerts.push({ type: 'warning', vital: 'diastolic', value: String(diastolic), message: 'High blood pressure detected' })
      } else if (diastolic < 60) {
        alerts.push({ type: 'warning', vital: 'diastolic', value: String(diastolic), message: 'Low blood pressure detected' })
      }
    }

    // Temperature alerts
    const temp = vitals.temperature ? parseFloat(vitals.temperature) : null
    if (temp) {
      if (temp >= 40) {
        alerts.push({ type: 'critical', vital: 'temperature', value: String(temp), message: 'Very high fever - immediate attention required' })
      } else if (temp >= 38.5) {
        alerts.push({ type: 'warning', vital: 'temperature', value: String(temp), message: 'Fever detected' })
      } else if (temp < 35) {
        alerts.push({ type: 'warning', vital: 'temperature', value: String(temp), message: 'Hypothermia detected' })
      }
    }

    // Pulse alerts
    const pulse = vitals.pulse ? parseInt(vitals.pulse) : null
    if (pulse) {
      if (pulse > 150) {
        alerts.push({ type: 'critical', vital: 'pulse', value: String(pulse), message: 'Very high heart rate - immediate attention required' })
      } else if (pulse > 120) {
        alerts.push({ type: 'warning', vital: 'pulse', value: String(pulse), message: 'High heart rate detected' })
      } else if (pulse < 50) {
        alerts.push({ type: 'warning', vital: 'pulse', value: String(pulse), message: 'Low heart rate detected' })
      }
    }

    // Oxygen saturation alerts
    const spo2 = vitals.oxygenSaturation ? parseInt(vitals.oxygenSaturation) : null
    if (spo2) {
      if (spo2 < 90) {
        alerts.push({ type: 'critical', vital: 'oxygenSaturation', value: String(spo2), message: 'Low oxygen saturation - immediate attention required' })
      } else if (spo2 < 95) {
        alerts.push({ type: 'warning', vital: 'oxygenSaturation', value: String(spo2), message: 'Below normal oxygen saturation' })
      }
    }

    // Respiratory rate alerts
    const rr = vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null
    if (rr) {
      if (rr > 30) {
        alerts.push({ type: 'critical', vital: 'respiratoryRate', value: String(rr), message: 'Very high respiratory rate - immediate attention required' })
      } else if (rr > 24) {
        alerts.push({ type: 'warning', vital: 'respiratoryRate', value: String(rr), message: 'High respiratory rate detected' })
      } else if (rr < 10) {
        alerts.push({ type: 'critical', vital: 'respiratoryRate', value: String(rr), message: 'Very low respiratory rate - immediate attention required' })
      }
    }

    return alerts
  }

  /**
   * Create alerts for abnormal vitals
   */
  private async createVitalAlerts(vitals: VitalSigns, alerts: VitalAlert[], context: ServiceContext): Promise<void> {
    try {
      const { getPrisma } = await import('@/lib/db')
      const prisma = await getPrisma()
      const p = prisma as any

      for (const alert of alerts) {
        // Create notification for doctors and nurses
        const users = await p.users.findMany({
          where: {
            role: { in: ['DOCTOR', 'NURSE', 'MATRON'] },
            isActive: true
          },
          select: { id: true }
        })

        for (const user of users) {
          await p.notifications.create({
            data: {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId: user.id,
              type: 'vital_alert',
              title: `Vital Alert: ${alert.type.toUpperCase()}`,
              message: alert.message,
              priority: alert.type === 'critical' ? 'high' : 'normal',
              data: {
                vitalsId: vitals.id,
                patientId: vitals.patientId,
                alert
              },
              read: false
            }
          })
        }
      }

      logger.info('Vital alerts created', { 
        vitalsId: vitals.id, 
        alertCount: alerts.length,
        criticalCount: alerts.filter(a => a.type === 'critical').length 
      })
    } catch (e) {
      logger.error('Failed to create vital alerts', { error: String(e) })
    }
  }

  /**
   * Validate vitals creation
   */
  async validateCreate(data: CreateVitalsData, context?: ServiceContext): Promise<void> {
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
export const vitalsService = new VitalsService()
