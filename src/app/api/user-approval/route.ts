// User Approval API - Admin approval/rejection of pending users
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma, testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('UserApproval')

// GET - Get all pending users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    const prisma = await getPrisma()
    if (!prisma) {
      return successResponse({ users: [], mode: 'demo' })
    }

    const p = prisma as any

    const users = await p.users.findMany({
      where: { approvalStatus: status },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        initials: true,
        approvalStatus: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    logger.info('Fetched users', { status, count: users.length })

    return successResponse({ users, count: users.length })

  } catch (error) {
    return errorResponse(error, { module: 'UserApproval', operation: 'get' })
  }
}

// PUT - Approve or reject a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, adminId, adminName, reason } = body

    logger.info('Approval action', { userId, action, adminId })

    if (!userId || !action || !adminId) {
      throw Errors.validation('User ID, action, and admin ID are required')
    }

    if (!['approve', 'reject'].includes(action)) {
      throw Errors.validation('Action must be "approve" or "reject"')
    }

    const prisma = await getPrisma()
    if (!prisma) {
      throw Errors.database('Database unavailable')
    }

    const p = prisma as any

    // Check if user exists
    const user = await p.users.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw Errors.notFound('User not found')
    }

    if (user.approvalStatus !== 'PENDING') {
      throw Errors.validation(`User is already ${user.approvalStatus.toLowerCase()}`)
    }

    // Update user status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    await p.users.update({
      where: { id: userId },
      data: {
        approvalStatus: newStatus,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    })

    logger.info('User approval updated', { 
      userId, 
      newStatus, 
      approvedBy: adminId,
      adminName 
    })

    // Create audit log
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
          description: `${adminName} ${action}ed user ${user.name} (${user.email}) as ${user.role}${reason ? `. Reason: ${reason}` : ''}`,
          userId: adminId,
          userName: adminName,
          metadata: {
            targetUserId: userId,
            targetUserName: user.name,
            targetUserEmail: user.email,
            targetUserRole: user.role,
            action,
            reason
          }
        })
      })
    } catch {
      // Ignore audit errors
    }

    return successResponse({
      message: `User ${action}ed successfully`,
      userId,
      newStatus,
      approvedBy: adminId,
      approvedAt: new Date().toISOString()
    })

  } catch (error) {
    return errorResponse(error, { module: 'UserApproval', operation: 'update' })
  }
}
