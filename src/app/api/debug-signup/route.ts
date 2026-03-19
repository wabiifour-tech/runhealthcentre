// Debug endpoint to test signup - DISABLED IN PRODUCTION
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  // SECURITY: Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Not available in production',
      message: 'Debug endpoints are disabled in production mode'
    }, { status: 403 })
  }

  const debug: Record<string, any> = { steps: [] }

  try {
    const body = await request.json()
    debug.input = body

    const prisma = await getPrisma()
    if (!prisma) {
      debug.steps.push({ step: 'prisma_init', success: false, error: 'Database unavailable' })
      return NextResponse.json({ success: false, debug })
    }
    const p = prisma as any

    // Step 1: Test Prisma connection
    debug.steps.push({ step: 'connecting', timestamp: new Date().toISOString() })
    
    try {
      await p.$queryRaw`SELECT 1 as test`
      debug.steps.push({ step: 'connected', success: true })
    } catch (connError: any) {
      debug.steps.push({ step: 'connected', success: false, error: connError.message })
      return NextResponse.json({ success: false, debug })
    }
    
    // Step 2: Check if users table exists by trying to query it
    try {
      const userCount = await p.users.count()
      debug.steps.push({ step: 'check_table', success: true, userCount })
    } catch (tableError: any) {
      debug.steps.push({ step: 'check_table', success: false, error: tableError.message })
    }
    
    // Step 3: Try to insert
    if (body.testInsert) {
      const userId = `test_${Date.now()}`
      debug.steps.push({ step: 'inserting', userId })
      
      try {
        await p.users.create({
          data: {
            id: userId,
            email: `test${Date.now()}@ruhc`,
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            password: 'hashedpassword123',
            role: 'NURSE',
            department: null,
            initials: 'TU',
            phone: null,
            isActive: true,
            isFirstLogin: false,
            approvalStatus: 'PENDING',
            createdAt: new Date()
          }
        })
        debug.steps.push({ step: 'insert', success: true })
        
        // Clean up
        await p.users.delete({ where: { id: userId } })
        debug.steps.push({ step: 'cleanup', success: true })
      } catch (insertError: any) {
        debug.steps.push({ 
          step: 'insert', 
          success: false, 
          error: insertError.message,
          code: insertError.code
        })
      }
    }
    
    return NextResponse.json({ success: true, debug })
    
  } catch (error: any) {
    debug.error = error.message
    debug.errorCode = error.code
    return NextResponse.json({ success: false, debug })
  }
}
