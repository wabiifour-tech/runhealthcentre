// User Approval API - Admin approval/rejection of pending users
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma, testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'

const logger = createLogger('UserApproval')

// Direct database connection as fallback
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// GET - Get all pending users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    const prisma = await getPrisma()
    if (prisma) {
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
    }

    // Fallback to direct pg
    const pool = getPool()
    const result = await pool.query(`
      SELECT id, email, name, "firstName", "lastName", role, department, phone, initials, 
             "approvalStatus", "approvedBy", "approvedAt"::text, "createdAt"::text
      FROM users 
      WHERE "approvalStatus" = $1
      ORDER BY "createdAt" DESC
    `, [status])
    await pool.end()

    return successResponse({ users: result.rows, count: result.rows.length })

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

    // Try Prisma first
    const prisma = await getPrisma()
    if (prisma) {
      try {
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

        logger.info('User approval updated via Prisma', { 
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
              metadata: {
                targetUserId: userId,
                targetUserName: user.name,
                targetUserEmail: user.email,
                targetUserRole: user.role,
                action,
                reason
              },
              timestamp: new Date()
            }
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
      } catch (prismaError: any) {
        if (prismaError.name === 'ApiError') throw prismaError
        logger.warn('Prisma failed, trying direct connection', { error: prismaError.message })
      }
    }

    // Fallback to direct pg
    const pool = getPool()
    try {
      // Check if user exists and is pending
      const checkResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      )

      if (checkResult.rows.length === 0) {
        await pool.end()
        throw Errors.notFound('User not found')
      }

      const user = checkResult.rows[0]
      if (user.approvalStatus !== 'PENDING') {
        await pool.end()
        throw Errors.validation(`User is already ${user.approvalStatus.toLowerCase()}`)
      }

      // Update user status
      await pool.query(`
        UPDATE users 
        SET "approvalStatus" = $1, "approvedBy" = $2, "approvedAt" = $3, "updatedAt" = $4
        WHERE id = $5
      `, [newStatus, adminId, new Date(), new Date(), userId])

      logger.info('User approval updated via direct pg', { 
        userId, 
        newStatus, 
        approvedBy: adminId,
        adminName 
      })

      // Create audit log
      try {
        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await pool.query(`
          INSERT INTO audit_logs (id, "userId", "userName", action, description, metadata, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          auditId,
          adminId,
          adminName,
          action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
          `${adminName} ${action}ed user ${user.name} (${user.email}) as ${user.role}${reason ? `. Reason: ${reason}` : ''}`,
          JSON.stringify({
            targetUserId: userId,
            targetUserName: user.name,
            targetUserEmail: user.email,
            targetUserRole: user.role,
            action,
            reason
          }),
          new Date()
        ])
      } catch {
        // Ignore audit errors
      }

      await pool.end()

      return successResponse({
        message: `User ${action}ed successfully`,
        userId,
        newStatus,
        approvedBy: adminId,
        approvedAt: new Date().toISOString()
      })
    } catch (dbError) {
      await pool.end()
      throw dbError
    }

  } catch (error) {
    return errorResponse(error, { module: 'UserApproval', operation: 'update' })
  }
}
