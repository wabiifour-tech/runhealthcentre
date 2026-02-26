import { NextRequest, NextResponse } from 'next/server'

// Speech-to-Text API
// Uses browser-based speech recognition - no external API needed

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
}

// Clean up transcription with medical terms
function enhanceTranscription(text: string): string {
  let enhanced = text
  
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

    // If text is provided, enhance it with medical context
    if (text && text.trim().length > 0) {
      const enhancedText = enhanceTranscription(text.trim())
      
      return NextResponse.json({
        success: true,
        transcription: enhancedText,
        rawTranscription: text.trim(),
        wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length
      })
    }

    // No text provided - return instructions for browser-based ASR
    return NextResponse.json({
      success: true,
      useBrowserASR: true,
      message: 'Use browser Web Speech API for speech recognition',
      implementation: `
// Client-side ASR using Web Speech API:
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-NG'; // Nigerian English

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  // Send text to /api/asr for enhancement
};

recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error);
};

recognition.start();
      `
    })

  } catch (error) {
    console.error('ASR API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Speech processing failed'
    }, { status: 500 })
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Speech-to-Text (ASR) API',
    mode: 'browser-based',
    description: 'Uses browser Web Speech API - no external API needed',
    supportedLanguages: ['en-NG', 'en-US', 'en-GB'],
    features: [
      'Nigerian accent recognition',
      'Medical terminology enhancement',
      'Real-time transcription'
    ],
    instructions: 'Use browser Web Speech API for transcription, then POST text to this endpoint for medical term enhancement'
  })
}
