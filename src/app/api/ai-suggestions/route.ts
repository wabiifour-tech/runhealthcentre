import { NextRequest, NextResponse } from 'next/server'

interface DiagnosisSuggestion {
  condition: string
  confidence: number
  description: string
  recommendations: string[]
}

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommendation: string
}

interface TriageRecommendation {
  priority: 'normal' | 'urgent' | 'emergency'
  color: string
  reason: string
  recommendedActions: string[]
}

// Common conditions in Nigeria with symptoms mapping
const CONDITION_PATTERNS: Record<string, { keywords: string[], condition: string, description: string, recommendations: string[] }> = {
  malaria: {
    keywords: ['fever', 'chills', 'sweating', 'headache', 'body pain', 'joint pain', 'malaria', 'hot body'],
    condition: 'Malaria',
    description: 'A mosquito-borne infectious disease common in tropical regions. Symptoms typically include fever, chills, and flu-like illness.',
    recommendations: [
      'Perform malaria parasite test (RDT or microscopy)',
      'Start appropriate antimalarial treatment (ACT)',
      'Monitor for complications',
      'Educate on mosquito bite prevention'
    ]
  },
  typhoid: {
    keywords: ['typhoid', 'prolonged fever', 'abdominal pain', 'diarrhea', 'constipation', 'rose spots'],
    condition: 'Typhoid Fever',
    description: 'A bacterial infection caused by Salmonella typhi, spread through contaminated food and water.',
    recommendations: [
      'Perform Widal test or blood culture',
      'Start antibiotic therapy (Ciprofloxacin or Azithromycin)',
      'Monitor for intestinal complications',
      'Educate on food and water hygiene'
    ]
  },
  hypertension: {
    keywords: ['headache', 'dizziness', 'blurred vision', 'high bp', 'high blood pressure', 'hypertension', 'chest pain'],
    condition: 'Hypertension',
    description: 'A common condition where the force of blood against artery walls is too high.',
    recommendations: [
      'Confirm with multiple BP readings',
      'Start lifestyle modifications',
      'Consider antihypertensive medication',
      'Regular follow-up and monitoring'
    ]
  },
  diabetes: {
    keywords: ['excessive thirst', 'frequent urination', 'weight loss', 'diabetes', 'sugar', 'high sugar', 'blurred vision'],
    condition: 'Diabetes Mellitus',
    description: 'A metabolic disorder characterized by high blood sugar levels over a prolonged period.',
    recommendations: [
      'Perform fasting blood glucose and HbA1c tests',
      'Start dietary modifications',
      'Consider oral hypoglycemic agents or insulin',
      'Regular blood sugar monitoring'
    ]
  },
  respiratory: {
    keywords: ['cough', 'difficulty breathing', 'shortness of breath', 'chest tightness', 'wheeze', 'pneumonia'],
    condition: 'Respiratory Tract Infection',
    description: 'Infection of the respiratory tract, which can affect the upper or lower respiratory system.',
    recommendations: [
      'Perform chest X-ray if indicated',
      'Assess oxygen saturation',
      'Consider antibiotic therapy if bacterial',
      'Supportive care and hydration'
    ]
  },
  gastroenteritis: {
    keywords: ['vomiting', 'diarrhea', 'stomach pain', 'abdominal cramps', 'cholera', 'loose stool'],
    condition: 'Gastroenteritis',
    description: 'Inflammation of the stomach and intestines, typically caused by infection.',
    recommendations: [
      'Assess hydration status',
      'Oral rehydration therapy',
      'Monitor electrolytes',
      'Consider antibiotics in severe cases'
    ]
  }
}

// Simple diagnosis suggestion based on keyword matching
async function getDiagnosisSuggestions(symptoms: string): Promise<DiagnosisSuggestion[]> {
  const lowerSymptoms = symptoms.toLowerCase()
  const suggestions: DiagnosisSuggestion[] = []
  
  for (const [key, pattern] of Object.entries(CONDITION_PATTERNS)) {
    const matchCount = pattern.keywords.filter(keyword => 
      lowerSymptoms.includes(keyword.toLowerCase())
    ).length
    
    if (matchCount > 0) {
      suggestions.push({
        condition: pattern.condition,
        confidence: Math.min(0.9, matchCount * 0.25 + 0.3),
        description: pattern.description,
        recommendations: pattern.recommendations
      })
    }
  }
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  // If no matches, provide general suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      condition: 'Requires Further Assessment',
      confidence: 0.5,
      description: 'Unable to determine specific condition based on provided symptoms. A thorough clinical examination is recommended.',
      recommendations: [
        'Perform comprehensive physical examination',
        'Order relevant laboratory investigations',
        'Consider specialist referral if needed',
        'Document all findings in patient record'
      ]
    })
  }
  
  return suggestions.slice(0, 3) // Return top 3
}

// Common drug interactions database
const DRUG_INTERACTIONS: Record<string, DrugInteraction> = {
  'paracetamol-ibuprofen': {
    drug1: 'Paracetamol',
    drug2: 'Ibuprofen',
    severity: 'mild',
    description: 'Generally safe to use together for short periods, but may increase risk of kidney problems with prolonged use.',
    recommendation: 'Monitor kidney function if used together long-term.'
  },
  'metformin-ciprofloxacin': {
    drug1: 'Metformin',
    drug2: 'Ciprofloxacin',
    severity: 'moderate',
    description: 'May increase risk of lactic acidosis and hypoglycemia.',
    recommendation: 'Monitor blood glucose levels closely; adjust metformin dose if needed.'
  },
  'aspirin-warfarin': {
    drug1: 'Aspirin',
    drug2: 'Warfarin',
    severity: 'severe',
    description: 'Significantly increased risk of bleeding.',
    recommendation: 'Avoid combination if possible; monitor INR closely if both are necessary.'
  },
  'artesunate-chloroquine': {
    drug1: 'Artesunate',
    drug2: 'Chloroquine',
    severity: 'moderate',
    description: 'Antagonistic effects may reduce efficacy of both antimalarials.',
    recommendation: 'Avoid combination; choose one antimalarial regimen.'
  }
}

// Drug interaction checker
async function checkDrugInteractions(drugs: string[]): Promise<DrugInteraction[]> {
  if (drugs.length < 2) return []
  
  const interactions: DrugInteraction[] = []
  const lowerDrugs = drugs.map(d => d.toLowerCase())
  
  for (const [key, interaction] of Object.entries(DRUG_INTERACTIONS)) {
    const drug1Lower = interaction.drug1.toLowerCase()
    const drug2Lower = interaction.drug2.toLowerCase()
    
    const hasDrug1 = lowerDrugs.some(d => d.includes(drug1Lower) || drug1Lower.includes(d))
    const hasDrug2 = lowerDrugs.some(d => d.includes(drug2Lower) || drug2Lower.includes(d))
    
    if (hasDrug1 && hasDrug2) {
      interactions.push(interaction)
    }
  }
  
  return interactions
}

// Medical notes summarizer (extracts key points)
async function summarizeMedicalNotes(notes: string): Promise<string> {
  if (!notes || notes.length < 50) return notes
  
  // Simple summarization: extract sentences with key medical terms
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const medicalKeywords = ['diagnosis', 'symptom', 'pain', 'fever', 'bp', 'blood', 'treatment', 'prescribed', 'patient', 'history', 'complaint', 'medication', 'dose', 'mg', 'ml']
  
  const importantSentences = sentences.filter(sentence => 
    medicalKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  )
  
  if (importantSentences.length === 0) {
    return notes.substring(0, 200) + (notes.length > 200 ? '...' : '')
  }
  
  return '• ' + importantSentences.slice(0, 5).join('\n• ')
}

// Triage recommendation based on vital signs
async function getTriageRecommendation(
  vitalSigns: {
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    temperature?: number
    pulse?: number
    respiratoryRate?: number
    oxygenSaturation?: number
    painScore?: number
  },
  symptoms: string
): Promise<TriageRecommendation> {
  
  // Check for emergency conditions
  if (vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureSystolic > 180) {
    return {
      priority: 'emergency',
      color: 'red',
      reason: 'Critically high blood pressure - risk of stroke or organ damage',
      recommendedActions: ['Immediate physician assessment', 'Prepare IV antihypertensive', 'Continuous monitoring', 'Prepare for possible emergency intervention']
    }
  }
  
  if (vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureSystolic < 90) {
    return {
      priority: 'emergency',
      color: 'red',
      reason: 'Critically low blood pressure - possible shock',
      recommendedActions: ['Immediate physician assessment', 'IV fluid resuscitation', 'Prepare vasopressors', 'Identify cause of hypotension']
    }
  }
  
  if (vitalSigns.temperature && vitalSigns.temperature > 40) {
    return {
      priority: 'emergency',
      color: 'red',
      reason: 'Extremely high fever - risk of febrile convulsions and organ damage',
      recommendedActions: ['Immediate cooling measures', 'Antipyretic medication', 'Identify infection source', 'Monitor for seizures']
    }
  }
  
  if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 90) {
    return {
      priority: 'emergency',
      color: 'red',
      reason: 'Severe hypoxia - requires immediate intervention',
      recommendedActions: ['Immediate oxygen supplementation', 'Prepare for intubation if needed', 'Chest X-ray', 'Arterial blood gas analysis']
    }
  }
  
  // Check for urgent conditions
  if (vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureSystolic > 160) {
    return {
      priority: 'urgent',
      color: 'yellow',
      reason: 'Significantly elevated blood pressure',
      recommendedActions: ['Prompt physician assessment', 'Blood pressure monitoring', 'Consider oral antihypertensive', 'Investigate underlying cause']
    }
  }
  
  if (vitalSigns.pulse && (vitalSigns.pulse > 140 || vitalSigns.pulse < 50)) {
    return {
      priority: 'urgent',
      color: 'yellow',
      reason: 'Abnormal heart rate requiring investigation',
      recommendedActions: ['ECG monitoring', 'Identify cause', 'Consider cardiology consult', 'Prepare for rate control if needed']
    }
  }
  
  if (vitalSigns.painScore && vitalSigns.painScore > 7) {
    return {
      priority: 'urgent',
      color: 'yellow',
      reason: 'Severe pain requiring prompt attention',
      recommendedActions: ['Pain assessment', 'Consider analgesic medication', 'Identify pain source', 'Monitor response to treatment']
    }
  }
  
  if (vitalSigns.respiratoryRate && (vitalSigns.respiratoryRate > 30 || vitalSigns.respiratoryRate < 10)) {
    return {
      priority: 'urgent',
      color: 'yellow',
      reason: 'Abnormal respiratory rate',
      recommendedActions: ['Respiratory assessment', 'Oxygen saturation monitoring', 'Consider chest X-ray', 'Prepare respiratory support if needed']
    }
  }
  
  // Default: normal priority
  return {
    priority: 'normal',
    color: 'green',
    reason: 'Vital signs within acceptable parameters',
    recommendedActions: ['Standard assessment protocol', 'Document findings', 'Schedule follow-up as needed']
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'diagnosis': {
        const suggestions = await getDiagnosisSuggestions(data.symptoms)
        return NextResponse.json({ 
          success: true, 
          suggestions,
          note: 'Suggestions based on symptom pattern matching. Always verify with clinical assessment.'
        })
      }
      
      case 'drug-interaction': {
        const interactions = await checkDrugInteractions(data.drugs)
        return NextResponse.json({ 
          success: true, 
          interactions,
          note: 'Based on common drug interaction database. Always verify with current references.'
        })
      }
      
      case 'summarize': {
        const summary = await summarizeMedicalNotes(data.notes)
        return NextResponse.json({ success: true, summary })
      }
      
      case 'triage': {
        const recommendation = await getTriageRecommendation(data.vitalSigns, data.symptoms)
        return NextResponse.json({ 
          success: true, 
          recommendation,
          note: 'Based on standard triage guidelines. Clinical judgment should take precedence.'
        })
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid request type' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Suggestions API (Built-in Medical Knowledge Base)',
    mode: 'local',
    note: 'This version uses built-in medical knowledge and pattern matching. No external API required.',
    endpoints: [
      { type: 'diagnosis', description: 'Get diagnosis suggestions based on symptoms (pattern matching)' },
      { type: 'drug-interaction', description: 'Check for drug interactions (local database)' },
      { type: 'summarize', description: 'Summarize medical notes (keyword extraction)' },
      { type: 'triage', description: 'Get triage recommendation based on vital signs (rule-based)' }
    ]
  })
}
