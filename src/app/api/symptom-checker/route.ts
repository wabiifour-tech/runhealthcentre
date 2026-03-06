import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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

    const zai = await ZAI.create()

    const systemPrompt = `You are a medical triage AI assistant for a university health centre. Analyze symptoms and provide:
1. Possible conditions with probability estimates
2. Urgency level (self_care, see_doctor_soon, see_doctor_today, emergency)
3. General advice
4. Recommended actions
5. Red flags that require immediate attention

IMPORTANT: Always include a disclaimer that this is not a substitute for professional medical advice. Always err on the side of caution.

Respond in JSON format:
{
  "possibleConditions": [
    {
      "name": "condition name",
      "probability": "High/Medium/Low",
      "urgency": "low/medium/high/emergency",
      "description": "brief description",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  ],
  "generalAdvice": "general advice text",
  "recommendedActions": ["action 1", "action 2"],
  "urgencyLevel": "self_care/see_doctor_soon/see_doctor_today/emergency",
  "redFlags": ["red flag 1", "red flag 2"]
}`

    const userMessage = `Patient Information:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Duration of symptoms: ${duration || 'Not specified'}
- Symptoms: ${symptoms}
- Additional information: ${additionalInfo || 'None'}

Please analyze these symptoms and provide triage guidance.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const responseText = completion.choices[0]?.message?.content || ''
    
    // Parse the JSON response
    let analysis: SymptomAnalysis
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      // Fallback analysis
      analysis = {
        possibleConditions: [
          {
            name: 'Requires Medical Evaluation',
            probability: 'Medium',
            urgency: 'medium',
            description: 'Your symptoms require evaluation by a healthcare professional',
            recommendations: ['Visit the health centre for proper assessment']
          }
        ],
        generalAdvice: 'Please visit the health centre for a proper medical evaluation.',
        recommendedActions: ['Book an appointment', 'Monitor your symptoms'],
        urgencyLevel: 'see_doctor_soon',
        redFlags: ['If symptoms worsen, seek immediate medical attention']
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      disclaimer: 'This AI analysis is for informational purposes only and does not replace professional medical advice. If you are experiencing a medical emergency, please call emergency services immediately.'
    })

  } catch (error) {
    console.error('Symptom checker error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze symptoms. Please try again or visit the health centre.',
      fallback: {
        urgencyLevel: 'see_doctor_soon',
        recommendedActions: ['Visit the health centre for proper assessment'],
        generalAdvice: 'We recommend visiting the health centre for proper medical evaluation.'
      }
    }, { status: 500 })
  }
}
