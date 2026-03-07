// Add referredTo column to consultations table
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }

    // Add columns directly via raw SQL
    try {
      await prisma.$executeRaw`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "referredTo" TEXT`
    } catch (e: any) {
      if (!e.message.includes('already exists')) console.log('referredTo:', e.message)
    }

    try {
      await prisma.$executeRaw`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "sentByNurseInitials" TEXT`
    } catch (e: any) {
      if (!e.message.includes('already exists')) console.log('sentByNurseInitials:', e.message)
    }

    return NextResponse.json({ success: true, message: 'Columns added: referredTo, sentByNurseInitials' })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return POST({} as NextRequest)
}
