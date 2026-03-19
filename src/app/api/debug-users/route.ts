import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

// Debug endpoint to check users without auth
export async function GET() {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Database not connected',
        hint: 'Check DATABASE_URL environment variable'
      }, { status: 500 })
    }
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
