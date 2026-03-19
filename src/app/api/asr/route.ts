import { NextRequest, NextResponse } from 'next/server'

// Speech-to-Text API using Browser Web Speech API
// The frontend handles the actual speech recognition

// Common Nigerian medical terms for auto-correction
const MEDICAL_TERMS: Record<string, string> = {
  'panadol': 'Paracetamol',
  'high bp': 'Hypertension',
  'sugar sickness': 'Diabetes Mellitus',
  'jedi-jedi': 'Hemorrhoids',
  'agbo': 'Herbal mixture',
  'chemist': 'Pharmacy',
  'injection': 'Injection',
  'drip': 'IV Fluid',
  'test': 'Laboratory Test',
  'xray': 'X-Ray',
  'scan': 'Medical Imaging',
  'headache': 'Headache',
  'fever': 'Fever',
  'cough': 'Cough',
  'cold': 'Cold',
  'malaria': 'Malaria',
  'typhoid': 'Typhoid',
  'stomach pain': 'Abdominal Pain',
  'body pain': 'Body Aches',
  'catarrh': 'Catarrh',
}

// Clean up transcription with medical terms
function enhanceTranscription(text: string): string {
  let enhanced = text.toLowerCase()
  
  for (const [term, replacement] of Object.entries(MEDICAL_TERMS)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    enhanced = enhanced.replace(regex, replacement)
  }
  
  // Capitalize first letter of sentences
  enhanced = enhanced.replace(/(^\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
  
  return enhanced
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    // If text is provided directly (from Web Speech API), enhance it
    if (text && text.trim().length > 0) {
      const enhancedText = enhanceTranscription(text.trim())
      
      return NextResponse.json({
        success: true,
        transcription: enhancedText,
        rawTranscription: text.trim(),
        wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length
      })
    }

    // No valid input provided
    return NextResponse.json({
      success: false,
      error: 'No text provided for enhancement',
      message: 'Please use browser speech recognition and provide the transcribed text'
    }, { status: 400 })

  } catch (error: any) {
    console.error('ASR API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Text processing failed: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Speech-to-Text Enhancement API',
    mode: 'browser-based',
    description: 'Enhances text from browser Web Speech API with medical terminology',
    supportedLanguages: ['en-NG', 'en-US', 'en-GB'],
    features: [
      'Medical terminology enhancement',
      'Nigerian medical terms recognition',
      'Text processing and cleanup'
    ]
  })
}
