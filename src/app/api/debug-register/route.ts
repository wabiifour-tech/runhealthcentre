// Debug registration - shows detailed error
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma, testConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  const debug: any = {
    step: 'init',
    timestamp: new Date().toISOString()
  }

  try {
    // Step 1: Test connection
    debug.step = 'testing_connection'
    const dbTest = await testConnection()
    debug.dbTest = dbTest

    if (!dbTest.success) {
      return NextResponse.json({ success: false, debug, error: 'Connection failed' })
    }

    // Step 2: Get Prisma
    debug.step = 'getting_prisma'
    const prisma = await getPrisma()
    debug.hasPrisma = !!prisma

    if (!prisma) {
      return NextResponse.json({ success: false, debug, error: 'Prisma unavailable' })
    }

    // Step 3: Check if table exists
    debug.step = 'checking_users_table'
    const p = prisma as any
    
    try {
      const count = await p.users.count()
      debug.usersCount = count
    } catch (e: any) {
      debug.usersTableError = e.message
      return NextResponse.json({ success: false, debug, error: 'Users table error' })
    }

    // Step 4: Try to create a test user
    debug.step = 'creating_user'
    const testEmail = `test_${Date.now()}@test.com`
    const hashedPassword = await bcrypt.hash('TestPass123!', 12)
    
    try {
      const newUser = await p.users.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: testEmail,
          name: 'Test User Debug',
          password: hashedPassword,
          role: 'NURSE',
          department: 'Test',
          initials: 'TU',
          isActive: true,
          isFirstLogin: false,
          approvalStatus: 'PENDING',
          createdAt: new Date()
        }
      })
      debug.userCreated = true
      debug.userId = newUser.id
      debug.userEmail = newUser.email
    } catch (e: any) {
      debug.createError = e.message
      debug.createErrorCode = e.code
      debug.createErrorMeta = e.meta
      return NextResponse.json({ success: false, debug, error: 'User creation failed' })
    }

    return NextResponse.json({ success: true, debug })

  } catch (error: any) {
    debug.step = 'exception'
    debug.error = error.message
    debug.stack = error.stack
    return NextResponse.json({ success: false, debug, error: error.message })
  }
}
