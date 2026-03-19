// Vital Signs Templates - Pre-defined vital sets for different patient types
// Enables faster data entry and standardized assessments

export interface VitalTemplate {
  id: string
  name: string
  description: string
  category: 'adult' | 'pediatric' | 'antenatal' | 'emergency' | 'post_op' | 'chronic'
  fields: VitalField[]
  ageRange?: { min: number; max: number } // in years
  gestationWeeks?: { min: number; max: number } // for antenatal
}

export interface VitalField {
  name: string
  label: string
  unit: string
  required: boolean
  normalRange?: { min: number; max: number }
  criticalLow?: number
  criticalHigh?: number
  validation?: 'number' | 'text' | 'select'
  options?: string[] // for select type
}

export interface NormalRange {
  category: string
  ageGroup: string
  parameter: string
  min: number
  max: number
  unit: string
}

// Vital signs templates
export const VITAL_TEMPLATES: VitalTemplate[] = [
  // ADULT GENERAL
  {
    id: 'adult_general',
    name: 'Adult General',
    description: 'Standard adult vital signs assessment',
    category: 'adult',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 140 }, criticalLow: 70, criticalHigh: 180, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 90 }, criticalLow: 40, criticalHigh: 120, validation: 'number' },
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.0, max: 37.5 }, criticalLow: 35, criticalHigh: 40, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 60, max: 100 }, criticalLow: 40, criticalHigh: 150, validation: 'number' },
      { name: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', required: true, normalRange: { min: 12, max: 20 }, criticalLow: 8, criticalHigh: 30, validation: 'number' },
      { name: 'oxygenSaturation', label: 'SpO2', unit: '%', required: true, normalRange: { min: 95, max: 100 }, criticalLow: 90, criticalHigh: 100, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'height', label: 'Height', unit: 'cm', required: false, validation: 'number' },
      { name: 'painScore', label: 'Pain Score', unit: '/10', required: true, normalRange: { min: 0, max: 3 }, validation: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ],
    ageRange: { min: 18, max: 120 }
  },
  
  // PEDIATRIC
  {
    id: 'pediatric_general',
    name: 'Pediatric General',
    description: 'Vital signs for children (1-12 years)',
    category: 'pediatric',
    fields: [
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.0, max: 37.5 }, criticalLow: 35, criticalHigh: 40, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 70, max: 120 }, criticalLow: 50, criticalHigh: 160, validation: 'number' },
      { name: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', required: true, normalRange: { min: 20, max: 30 }, criticalLow: 15, criticalHigh: 40, validation: 'number' },
      { name: 'oxygenSaturation', label: 'SpO2', unit: '%', required: true, normalRange: { min: 95, max: 100 }, criticalLow: 90, criticalHigh: 100, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'height', label: 'Height/Length', unit: 'cm', required: true, validation: 'number' },
      { name: 'painScore', label: 'Pain Score', unit: '/10', required: true, validation: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ],
    ageRange: { min: 1, max: 12 }
  },
  
  // INFANT
  {
    id: 'infant_general',
    name: 'Infant (0-1 year)',
    description: 'Vital signs for infants',
    category: 'pediatric',
    fields: [
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.5, max: 37.5 }, criticalLow: 35.5, criticalHigh: 38.5, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 100, max: 160 }, criticalLow: 80, criticalHigh: 200, validation: 'number' },
      { name: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', required: true, normalRange: { min: 30, max: 60 }, criticalLow: 20, criticalHigh: 70, validation: 'number' },
      { name: 'oxygenSaturation', label: 'SpO2', unit: '%', required: true, normalRange: { min: 95, max: 100 }, criticalLow: 90, criticalHigh: 100, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'height', label: 'Length', unit: 'cm', required: true, validation: 'number' },
      { name: 'headCircumference', label: 'Head Circumference', unit: 'cm', required: true, validation: 'number' },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ],
    ageRange: { min: 0, max: 1 }
  },
  
  // ANTENATAL
  {
    id: 'antenatal',
    name: 'Antenatal Check',
    description: 'Antenatal vital signs and fetal assessment',
    category: 'antenatal',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 120 }, criticalLow: 80, criticalHigh: 140, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 80 }, criticalLow: 50, criticalHigh: 90, validation: 'number' },
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.0, max: 37.5 }, criticalLow: 35, criticalHigh: 38, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 70, max: 100 }, criticalLow: 50, criticalHigh: 120, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'fundalHeight', label: 'Fundal Height', unit: 'cm', required: true, validation: 'number' },
      { name: 'fetalHeartRate', label: 'Fetal Heart Rate', unit: 'bpm', required: true, normalRange: { min: 120, max: 160 }, criticalLow: 100, criticalHigh: 180, validation: 'number' },
      { name: 'fetalMovement', label: 'Fetal Movement', unit: '', required: true, validation: 'select', options: ['Present - Active', 'Present - Normal', 'Present - Reduced', 'Absent'] },
      { name: 'edema', label: 'Edema', unit: '', required: true, validation: 'select', options: ['None', 'Mild - Ankles only', 'Moderate - Legs', 'Severe - Hands/Face', 'Very Severe - Generalized'] },
      { name: 'urineProtein', label: 'Urine Protein', unit: '', required: true, validation: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'] },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ],
    gestationWeeks: { min: 12, max: 42 }
  },
  
  // EMERGENCY
  {
    id: 'emergency',
    name: 'Emergency Assessment',
    description: 'Rapid emergency vital signs',
    category: 'emergency',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 140 }, criticalLow: 70, criticalHigh: 180, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 90 }, criticalLow: 40, criticalHigh: 120, validation: 'number' },
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.0, max: 37.5 }, criticalLow: 35, criticalHigh: 40, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 60, max: 100 }, criticalLow: 40, criticalHigh: 150, validation: 'number' },
      { name: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', required: true, normalRange: { min: 12, max: 20 }, criticalLow: 8, criticalHigh: 30, validation: 'number' },
      { name: 'oxygenSaturation', label: 'SpO2', unit: '%', required: true, normalRange: { min: 95, max: 100 }, criticalLow: 90, criticalHigh: 100, validation: 'number' },
      { name: 'glasgowComaScale', label: 'GCS', unit: '/15', required: true, normalRange: { min: 15, max: 15 }, criticalLow: 8, criticalHigh: 15, validation: 'number' },
      { name: 'bloodGlucose', label: 'Blood Glucose', unit: 'mmol/L', required: true, normalRange: { min: 4, max: 7 }, criticalLow: 2.5, criticalHigh: 20, validation: 'number' },
      { name: 'painScore', label: 'Pain Score', unit: '/10', required: true, validation: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ]
  },
  
  // POST-OPERATIVE
  {
    id: 'post_op',
    name: 'Post-Operative',
    description: 'Post-operative monitoring vitals',
    category: 'post_op',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 140 }, criticalLow: 80, criticalHigh: 160, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 90 }, criticalLow: 50, criticalHigh: 100, validation: 'number' },
      { name: 'temperature', label: 'Temperature', unit: '°C', required: true, normalRange: { min: 36.0, max: 37.5 }, criticalLow: 35.5, criticalHigh: 38.5, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 60, max: 100 }, criticalLow: 50, criticalHigh: 130, validation: 'number' },
      { name: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', required: true, normalRange: { min: 12, max: 20 }, criticalLow: 10, criticalHigh: 25, validation: 'number' },
      { name: 'oxygenSaturation', label: 'SpO2', unit: '%', required: true, normalRange: { min: 95, max: 100 }, criticalLow: 92, criticalHigh: 100, validation: 'number' },
      { name: 'painScore', label: 'Pain Score', unit: '/10', required: true, validation: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { name: 'surgicalSite', label: 'Surgical Site', unit: '', required: true, validation: 'select', options: ['Clean - Dry', 'Clean - Minimal discharge', 'Redness present', 'Swelling present', 'Discharge present', 'Dehiscence'] },
      { name: 'drainOutput', label: 'Drain Output', unit: 'ml', required: false, validation: 'number' },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ]
  },
  
  // CHRONIC DISEASE - DIABETES
  {
    id: 'diabetes',
    name: 'Diabetes Review',
    description: 'Diabetes management vital signs',
    category: 'chronic',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 130 }, criticalLow: 80, criticalHigh: 160, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 80 }, criticalLow: 50, criticalHigh: 100, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'bloodGlucoseFasting', label: 'Fasting Glucose', unit: 'mmol/L', required: true, normalRange: { min: 4, max: 7 }, criticalLow: 3, criticalHigh: 15, validation: 'number' },
      { name: 'bloodGlucoseRandom', label: 'Random Glucose', unit: 'mmol/L', required: false, normalRange: { min: 4, max: 10 }, criticalLow: 3, criticalHigh: 20, validation: 'number' },
      { name: 'footExam', label: 'Foot Examination', unit: '', required: true, validation: 'select', options: ['Normal', 'Loss of sensation - Mild', 'Loss of sensation - Moderate', 'Ulcer present', 'Infection present', 'Gangrene'] },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ]
  },
  
  // CHRONIC DISEASE - HYPERTENSION
  {
    id: 'hypertension',
    name: 'Hypertension Review',
    description: 'Hypertension management vital signs',
    category: 'chronic',
    fields: [
      { name: 'bloodPressureSystolic', label: 'Systolic BP', unit: 'mmHg', required: true, normalRange: { min: 90, max: 130 }, criticalLow: 80, criticalHigh: 180, validation: 'number' },
      { name: 'bloodPressureDiastolic', label: 'Diastolic BP', unit: 'mmHg', required: true, normalRange: { min: 60, max: 80 }, criticalLow: 50, criticalHigh: 110, validation: 'number' },
      { name: 'pulse', label: 'Pulse Rate', unit: 'bpm', required: true, normalRange: { min: 60, max: 100 }, criticalLow: 50, criticalHigh: 120, validation: 'number' },
      { name: 'weight', label: 'Weight', unit: 'kg', required: true, validation: 'number' },
      { name: 'notes', label: 'Notes', unit: '', required: false, validation: 'text' }
    ]
  }
]

// Get template by ID
export function getVitalTemplate(id: string): VitalTemplate | undefined {
  return VITAL_TEMPLATES.find(t => t.id === id)
}

// Get templates by category
export function getVitalTemplatesByCategory(category: VitalTemplate['category']): VitalTemplate[] {
  return VITAL_TEMPLATES.filter(t => t.category === category)
}

// Get appropriate template based on patient age
export function getAppropriateTemplate(ageInYears: number, isPregnant: boolean = false): VitalTemplate {
  if (isPregnant) {
    return getVitalTemplate('antenatal')!
  }
  
  if (ageInYears < 1) {
    return getVitalTemplate('infant_general')!
  }
  
  if (ageInYears < 18) {
    return getVitalTemplate('pediatric_general')!
  }
  
  return getVitalTemplate('adult_general')!
}

// Check if vital is abnormal
export function isVitalAbnormal(field: VitalField, value: number): {
  isAbnormal: boolean
  isCritical: boolean
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high'
} {
  if (!field.normalRange) {
    return { isAbnormal: false, isCritical: false, status: 'normal' }
  }
  
  const { min, max } = field.normalRange
  
  if (value < (field.criticalLow ?? min)) {
    return { isAbnormal: true, isCritical: true, status: 'critical_low' }
  }
  
  if (value > (field.criticalHigh ?? max)) {
    return { isAbnormal: true, isCritical: true, status: 'critical_high' }
  }
  
  if (value < min) {
    return { isAbnormal: true, isCritical: false, status: 'low' }
  }
  
  if (value > max) {
    return { isAbnormal: true, isCritical: false, status: 'high' }
  }
  
  return { isAbnormal: false, isCritical: false, status: 'normal' }
}

// Get abnormal vital alerts from a set of vitals
export function getVitalAlerts(template: VitalTemplate, vitals: Record<string, any>): Array<{
  field: VitalField
  value: number
  status: string
  isCritical: boolean
}> {
  const alerts: Array<{ field: VitalField; value: number; status: string; isCritical: boolean }> = []
  
  template.fields.forEach(field => {
    const value = vitals[field.name]
    if (value !== undefined && value !== '' && field.validation === 'number') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        const result = isVitalAbnormal(field, numValue)
        if (result.isAbnormal) {
          alerts.push({
            field,
            value: numValue,
            status: result.status,
            isCritical: result.isCritical
          })
        }
      }
    }
  })
  
  return alerts
}

// Calculate BMI
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number
  category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely_obese'
} {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  
  let category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'severely_obese'
  if (bmi < 18.5) category = 'underweight'
  else if (bmi < 25) category = 'normal'
  else if (bmi < 30) category = 'overweight'
  else if (bmi < 40) category = 'obese'
  else category = 'severely_obese'
  
  return { bmi: parseFloat(bmi.toFixed(1)), category }
}

// Calculate Mean Arterial Pressure
export function calculateMAP(systolic: number, diastolic: number): number {
  return parseFloat(((diastolic + (systolic - diastolic) / 3)).toFixed(1))
}

// Calculate Pulse Pressure
export function calculatePulsePressure(systolic: number, diastolic: number): number {
  return systolic - diastolic
}
