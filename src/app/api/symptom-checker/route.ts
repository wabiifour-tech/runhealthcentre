import { NextRequest, NextResponse } from 'next/server'

interface SymptomAnalysis {
  possibleConditions: {
    name: string
    probability: string
    urgency: 'low' | 'medium' | 'high' | 'emergency'
    description: string
    recommendations: string[]
  }[]
  generalAdvice: string
  recommendedActions: string[]
  urgencyLevel: 'self_care' | 'see_doctor_soon' | 'see_doctor_today' | 'emergency'
  redFlags: string[]
}

// Emergency keywords that require immediate attention
const EMERGENCY_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'can\'t breathe', 'shortness of breath',
  'severe bleeding', 'unconscious', 'not breathing', 'heart attack',
  'stroke', 'seizure', 'severe head injury', 'poisoning', 'overdose',
  'suicidal', 'severe allergic', 'anaphylaxis', 'choking'
]

// Urgent keywords requiring same-day care
const URGENT_KEYWORDS = [
  'high fever', 'severe pain', 'vomiting blood', 'blood in stool',
  'severe headache', 'sudden vision', 'confusion', 'weakness on one side',
  'severe abdominal pain', 'dehydration', 'persistent vomiting'
]

// Common conditions in Nigerian context
const COMMON_CONDITIONS: { keywords: string[], condition: string, advice: string }[] = [
  {
    keywords: ['fever', 'chills', 'sweating', 'body ache', 'headache'],
    condition: 'Malaria (possible)',
    advice: 'Common in Nigeria. Requires blood test for confirmation. Visit the health centre for proper diagnosis and treatment.'
  },
  {
    keywords: ['cough', 'cold', 'runny nose', 'sneezing', 'sore throat'],
    condition: 'Upper Respiratory Infection',
    advice: 'Usually viral. Rest, fluids, and symptomatic treatment. See doctor if symptoms persist beyond 7 days.'
  },
  {
    keywords: ['stomach pain', 'diarrhea', 'vomiting', 'nausea'],
    condition: 'Gastroenteritis / Food-related illness',
    advice: 'Stay hydrated with ORS. Rest the stomach. See doctor if severe or persistent.'
  },
  {
    keywords: ['headache', 'migraine', 'head pain'],
    condition: 'Headache / Migraine',
    advice: 'Rest in a quiet, dark room. Hydration and pain relief may help. See doctor if severe or persistent.'
  },
  {
    keywords: ['rash', 'itching', 'skin'],
    condition: 'Skin condition / Allergic reaction',
    advice: 'May be allergic reaction or infection. Avoid scratching. See doctor for proper assessment.'
  }
]

function analyzeSymptoms(symptoms: string, age?: string, gender?: string, duration?: string): SymptomAnalysis {
  const symptomsLower = symptoms.toLowerCase()
  
  // Check for emergency keywords
  const hasEmergency = EMERGENCY_KEYWORDS.some(keyword => symptomsLower.includes(keyword))
  if (hasEmergency) {
    return {
      possibleConditions: [{
        name: 'Medical Emergency',
        probability: 'High',
        urgency: 'emergency',
        description: 'Your symptoms may indicate a medical emergency requiring immediate attention.',
        recommendations: [
          'Go to the nearest emergency room immediately',
          'Do not drive yourself - call for help',
          'If on campus, call the health centre emergency line'
        ]
      }],
      generalAdvice: 'Your symptoms require immediate medical attention. Please seek emergency care right away.',
      recommendedActions: ['Seek emergency medical care immediately', 'Do not delay', 'Have someone stay with you'],
      urgencyLevel: 'emergency',
      redFlags: ['This requires immediate emergency care']
    }
  }

  // Check for urgent keywords
  const hasUrgent = URGENT_KEYWORDS.some(keyword => symptomsLower.includes(keyword))
  if (hasUrgent) {
    return {
      possibleConditions: [{
        name: 'Urgent Medical Attention Required',
        probability: 'High',
        urgency: 'high',
        description: 'Your symptoms require prompt medical evaluation today.',
        recommendations: [
          'Visit the health centre today',
          'Do not wait for symptoms to worsen',
          'Bring a list of your current medications'
        ]
      }],
      generalAdvice: 'Your symptoms require prompt medical evaluation. Please visit the health centre today.',
      recommendedActions: ['Visit health centre today', 'Document your symptoms', 'Stay hydrated if possible'],
      urgencyLevel: 'see_doctor_today',
      redFlags: ['If symptoms worsen, seek immediate care']
    }
  }

  // Check for common conditions
  const matchedConditions: SymptomAnalysis['possibleConditions'] = []
  
  for (const condition of COMMON_CONDITIONS) {
    const matches = condition.keywords.filter(keyword => symptomsLower.includes(keyword))
    if (matches.length >= 2) {
      matchedConditions.push({
        name: condition.condition,
        probability: 'Medium',
        urgency: 'medium',
        description: condition.advice,
        recommendations: [
          'Visit the health centre for proper diagnosis',
          'Monitor your symptoms',
          'Stay hydrated and rest'
        ]
      })
    }
  }

  if (matchedConditions.length > 0) {
    return {
      possibleConditions: matchedConditions,
      generalAdvice: 'Based on your symptoms, you may have one of the conditions listed. Please visit the health centre for proper diagnosis and treatment.',
      recommendedActions: [
        'Book an appointment with a healthcare provider',
        'Monitor your symptoms',
        'Get adequate rest and stay hydrated'
      ],
      urgencyLevel: 'see_doctor_soon',
      redFlags: ['Seek immediate care if symptoms worsen significantly']
    }
  }

  // Default response for unrecognized symptoms
  return {
    possibleConditions: [{
      name: 'Requires Medical Evaluation',
      probability: 'Medium',
      urgency: 'medium',
      description: 'Your symptoms require evaluation by a healthcare professional for accurate diagnosis.',
      recommendations: [
        'Visit the health centre for proper assessment',
        'Document your symptoms in detail'
      ]
    }],
    generalAdvice: 'Please visit the health centre for a proper medical evaluation. A healthcare professional can provide accurate diagnosis and appropriate treatment.',
    recommendedActions: [
      'Book an appointment with a healthcare provider',
      'Monitor your symptoms',
      'Seek immediate care if symptoms worsen'
    ],
    urgencyLevel: 'see_doctor_soon',
    redFlags: [
      'Seek immediate care if you experience: severe chest pain, difficulty breathing, sudden severe headache, high fever, severe abdominal pain'
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, age, gender, duration, additionalInfo } = body

    if (!symptoms) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please describe your symptoms' 
      }, { status: 400 })
    }

    const analysis = analyzeSymptoms(symptoms, age, gender, duration)

    return NextResponse.json({
      success: true,
      analysis,
      disclaimer: '⚠️ IMPORTANT: This symptom checker provides general guidance only and does not replace professional medical advice. If you are experiencing a medical emergency, please call emergency services or go to the nearest hospital immediately.',
      symptomsProvided: { symptoms, age, gender, duration, additionalInfo }
    })

  } catch (error: any) {
    console.error('Symptom checker error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze symptoms. Please visit the health centre.',
      fallback: {
        urgencyLevel: 'see_doctor_soon',
        recommendedActions: [
          'Visit the health centre for proper assessment',
          'Document your symptoms including when they started'
        ],
        generalAdvice: 'We recommend visiting the health centre for proper medical evaluation.',
        redFlags: ['Seek immediate care for severe symptoms']
      }
    }, { status: 500 })
  }
}

// GET endpoint for API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'RUHC Symptom Checker',
    features: [
      'Keyword-based symptom analysis',
      'Emergency detection',
      'Common condition recognition',
      'Triage guidance'
    ],
    disclaimer: 'For informational purposes only. Always consult a healthcare professional for medical advice.'
  })
}
