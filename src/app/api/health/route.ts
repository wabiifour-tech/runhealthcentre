// Health Check API for Fly.io
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: "Redeemer's University Health Centre (RUHC) HMS",
    version: '1.0.0'
  })
}
