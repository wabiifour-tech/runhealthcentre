import { NextRequest, NextResponse } from 'next/server'

// Text-to-Speech API
// Uses browser-based TTS using Web Speech API - no external API needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      voice = 'default', 
      speed = 1.0,
      volume = 1.0
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Text is required' 
      }, { status: 400 })
    }

    // Return the text with instructions for browser-based TTS
    // The client will use the Web Speech API
    return NextResponse.json({
      success: true,
      useBrowserTTS: true,
      text: text.trim(),
      options: {
        voice,
        rate: Math.max(0.5, Math.min(2.0, speed)),
        volume: Math.max(0.1, Math.min(1.0, volume)),
        pitch: 1.0
      },
      message: 'Use browser Web Speech API for text-to-speech'
    })

  } catch (error) {
    console.error('TTS API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Text-to-speech request failed'
    }, { status: 500 })
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Text-to-Speech (TTS) API',
    mode: 'browser-based',
    description: 'Uses browser Web Speech API - no external API needed',
    parameters: {
      speed: { min: 0.5, max: 2.0, default: 1.0 },
      volume: { min: 0.1, max: 1.0, default: 1.0 }
    },
    maxTextLength: 5000,
    implementation: `
// Client-side TTS using Web Speech API:
const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = 1.0;
utterance.pitch = 1.0;
utterance.volume = 1.0;
speechSynthesis.speak(utterance);
    `
  })
}
