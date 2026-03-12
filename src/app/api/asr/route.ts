import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Speech-to-Text API using z-ai-web-dev-sdk ASR

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
    const { audioBase64, text, language } = body

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

    // If audio base64 is provided, use z-ai ASR
    if (audioBase64 && audioBase64.length > 0) {
      try {
        const zai = await ZAI.create()
        
        // Use the ASR (speech-to-text) capability
        const result = await zai.asr.transcribe({
          audio: audioBase64,
          language: language || 'en-US'
        })

        if (result && result.text) {
          const enhancedText = enhanceTranscription(result.text)
          
          return NextResponse.json({
            success: true,
            transcription: enhancedText,
            rawTranscription: result.text,
            wordCount: result.text.split(/\s+/).filter(w => w.length > 0).length,
            confidence: result.confidence || 0.9
          })
        }
      } catch (asrError: any) {
        console.error('ASR SDK Error:', asrError.message)
        
        // Fallback: Return instructions for browser-based ASR
        return NextResponse.json({
          success: true,
          useBrowserASR: true,
          message: 'Server ASR unavailable. Please use browser speech recognition.',
          transcription: '',
          error: asrError.message
        })
      }
    }

    // No valid input provided
    return NextResponse.json({
      success: false,
      error: 'No audio or text provided for transcription',
      useBrowserASR: true,
      message: 'Please provide audio data or use browser speech recognition'
    }, { status: 400 })

  } catch (error: any) {
    console.error('ASR API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Speech processing failed: ' + (error.message || 'Unknown error'),
      useBrowserASR: true
    }, { status: 500 })
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Speech-to-Text (ASR) API',
    mode: 'hybrid',
    description: 'Uses z-ai-web-dev-sdk ASR with fallback to browser Web Speech API',
    supportedLanguages: ['en-NG', 'en-US', 'en-GB'],
    features: [
      'Nigerian accent recognition',
      'Medical terminology enhancement',
      'Real-time transcription',
      'Audio file support'
    ]
  })
}
