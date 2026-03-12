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
  sources?: string[]
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

    // First, search the web for relevant medical information
    let webSearchResults = ''
    let sources: string[] = []
    
    try {
      const searchQuery = `medical symptoms ${symptoms} ${age ? `age ${age}` : ''} ${gender || ''} diagnosis treatment`
      const searchResult = await zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 5
      })
      
      if (searchResult && Array.isArray(searchResult)) {
        webSearchResults = searchResult.map((r: any) => 
          `Source: ${r.name}\n${r.snippet}\nURL: ${r.url}`
        ).join('\n\n---\n\n')
        
        sources = searchResult.map((r: any) => ({
          name: r.name,
          url: r.url
        }))
      }
    } catch (searchError) {
      console.log('Web search failed, continuing with AI knowledge:', searchError)
    }

    const systemPrompt = `You are a highly accurate medical triage AI assistant for a university health centre. Your role is to analyze symptoms and provide accurate, evidence-based guidance.

You have access to web search results that you should use to provide accurate and up-to-date information.

Your analysis must be:
1. Medically accurate based on current medical knowledge
2. Conservative - always err on the side of caution
3. Include clear rationale for each condition suggested
4. Provide actionable recommendations

IMPORTANT GUIDELINES:
- Always include a disclaimer that this is not a substitute for professional medical advice
- When multiple conditions are possible, explain the reasoning
- For emergency symptoms (chest pain, difficulty breathing, severe bleeding, stroke symptoms), immediately recommend emergency care
- Consider common conditions in the Nigerian context (malaria, typhoid, etc.)
- Take into account patient age and gender when relevant

Respond in JSON format:
{
  "possibleConditions": [
    {
      "name": "condition name",
      "probability": "High/Medium/Low",
      "urgency": "low/medium/high/emergency",
      "description": "brief description with medical rationale",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  ],
  "generalAdvice": "general advice text with rationale",
  "recommendedActions": ["action 1", "action 2"],
  "urgencyLevel": "self_care/see_doctor_soon/see_doctor_today/emergency",
  "redFlags": ["red flag 1", "red flag 2"],
  "sources": ["source 1", "source 2"]
}`

    const userMessage = `Patient Information:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Duration of symptoms: ${duration || 'Not specified'}
- Symptoms: ${symptoms}
- Additional information: ${additionalInfo || 'None'}

${webSearchResults ? `Web Search Results for Reference:\n${webSearchResults}` : 'No web search results available - use your medical knowledge.'}

Please analyze these symptoms thoroughly and provide accurate triage guidance. Include medical rationale for your conclusions.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 2000
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
      // Fallback: use the raw text as general advice
      analysis = {
        possibleConditions: [
          {
            name: 'Requires Medical Evaluation',
            probability: 'Medium',
            urgency: 'medium',
            description: 'Your symptoms require evaluation by a healthcare professional for accurate diagnosis',
            recommendations: ['Visit the health centre for proper assessment', 'Document your symptoms in detail']
          }
        ],
        generalAdvice: responseText || 'Please visit the health centre for a proper medical evaluation.',
        recommendedActions: ['Book an appointment with a healthcare provider', 'Monitor your symptoms', 'Seek immediate care if symptoms worsen'],
        urgencyLevel: 'see_doctor_soon',
        redFlags: ['If symptoms worsen, seek immediate medical attention', 'If you experience severe pain, difficulty breathing, or high fever, go to emergency']
      }
    }

    // Add sources if available
    if (sources.length > 0 && !analysis.sources) {
      analysis.sources = sources.map(s => s.name)
    }

    return NextResponse.json({
      success: true,
      analysis,
      disclaimer: '⚠️ IMPORTANT: This AI analysis is for informational purposes only and does not replace professional medical advice. If you are experiencing a medical emergency (severe chest pain, difficulty breathing, stroke symptoms, severe bleeding), please call emergency services or go to the nearest hospital immediately.',
      sources: sources.length > 0 ? sources : undefined
    })

  } catch (error: any) {
    console.error('Symptom checker error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze symptoms. Please try again or visit the health centre.',
      details: error.message || 'Unknown error',
      fallback: {
        urgencyLevel: 'see_doctor_soon',
        recommendedActions: [
          'Visit the health centre for proper assessment',
          'Document your symptoms including when they started and what makes them better or worse',
          'Do not ignore worsening symptoms'
        ],
        generalAdvice: 'We recommend visiting the health centre for proper medical evaluation. A healthcare professional can provide accurate diagnosis and appropriate treatment.',
        redFlags: ['Seek immediate care if you experience: severe chest pain, difficulty breathing, sudden severe headache, high fever, severe abdominal pain, or any symptom that significantly worsens']
      }
    }, { status: 500 })
  }
}

// GET endpoint for API status
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'AI Symptom Checker',
    features: [
      'Web-search enhanced analysis',
      'Multi-condition differential diagnosis',
      'Urgency-based triage',
      'Nigerian context awareness',
      'Medical rationale included',
      'Unlimited usage'
    ],
    disclaimer: 'For informational purposes only. Always consult a healthcare professional for medical advice.'
  })
}
