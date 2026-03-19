// User Approval API - Admin approval/rejection of pending users
import { NextRequest } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('UserApproval')

// GET - Get all pending users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    const prisma = await getPrisma()
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

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    const prisma = await getPrisma()
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
      await p.audit_logs.create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: adminId,
          userName: adminName,
          action: action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
          description: `${adminName} ${action}ed user ${user.name} (${user.email}) as ${user.role}${reason ? `. Reason: ${reason}` : ''}`,
          metadata: JSON.stringify({
            targetUserId: userId,
            targetUserName: user.name,
            targetUserEmail: user.email,
            targetUserRole: user.role,
            action,
            reason
          }),
          timestamp: new Date()
        }
      })
    } catch {
      // Ignore audit errors
    }

    // CREATE NOTIFICATION FOR THE USER - THEY NEED TO KNOW THEIR STATUS
    try {
      await p.notifications.create({
        data: {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          type: 'account_status',
          title: action === 'approve' ? 'Account Approved!' : 'Account Update',
          message: action === 'approve' 
            ? 'Congratulations! Your account has been approved. You can now log in to the system.' 
            : `Your account application was not approved. ${reason ? `Reason: ${reason}` : 'Please contact administrator for more information.'}`,
          priority: action === 'approve' ? 'normal' : 'high',
          read: false,
          createdAt: new Date()
        }
      })
    } catch {
      // Ignore notification errors
    }

    // Broadcast real-time notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'user_status_changed',
          data: { userId, status: newStatus, email: user.email }
        })
      })
    } catch {}

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
