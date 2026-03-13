// Quick check for pending user approvals - lightweight endpoint for instant polling
import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PendingApprovals')

// Direct database connection as fallback
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
}

export async function GET() {
  // Try Prisma first
  try {
    const prisma = await getPrisma()
    
    if (prisma) {
      const p = prisma as any
      
      // Get only pending users (lightweight query)
      const pendingUsers = await p.users.findMany({
        where: { approvalStatus: 'PENDING' },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
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
    }
  } catch (error) {
    logger.warn('Prisma failed, trying direct connection', { error: String(error) })
  }

  // Fallback to direct pg connection
  const pool = getPool()
  try {
    const result = await pool.query(`
      SELECT id, email, name, "firstName", "lastName", role, department, phone, "createdAt"::text
      FROM users 
      WHERE "approvalStatus" = 'PENDING'
      ORDER BY "createdAt" DESC
    `)

    return NextResponse.json({ 
      success: true, 
      pendingUsers: result.rows,
      count: result.rows.length,
      timestamp: Date.now()
    })
  } catch (dbError) {
    logger.error('Failed to fetch pending approvals', { error: String(dbError) })
    return NextResponse.json({ 
      success: true, 
      pendingUsers: [],
      count: 0 
    })
  } finally {
    await pool.end()
  }
}
