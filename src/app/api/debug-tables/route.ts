// Debug API - Check database tables
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { getPrisma } = await import('@/lib/db')
    const prisma = getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database client not initialized' 
      })
    }

    const p = prisma as any
    
    // Try to count users
    try {
      const userCount = await p.user.count()
      return NextResponse.json({ 
        success: true, 
        message: 'User table exists',
        userCount,
        tables: 'Database is ready'
      })
    } catch (countError: any) {
      return NextResponse.json({ 
        success: false, 
        error: 'User table query failed',
        details: countError.message,
        code: countError.code,
        hint: 'The User table may not exist in Supabase. You need to run Prisma migrations or push the schema.'
      })
    }
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}
