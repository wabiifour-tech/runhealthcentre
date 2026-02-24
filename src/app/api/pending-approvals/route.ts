// Quick check for pending user approvals - lightweight endpoint for instant polling
import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PendingApprovals')

export async function GET() {
  try {
    const prisma = await getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        pendingUsers: [],
        count: 0 
      })
    }

    const p = prisma as any
    
    // Get only pending users (lightweight query)
    const pendingUsers = await p.users.findMany({
      where: { approvalStatus: 'PENDING' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      success: true, 
      pendingUsers,
      count: pendingUsers.length,
      timestamp: Date.now()
    })

  } catch (error) {
    logger.error('Failed to fetch pending approvals', { error: String(error) })
    return NextResponse.json({ 
      success: true, 
      pendingUsers: [],
      count: 0 
    })
  }
}
