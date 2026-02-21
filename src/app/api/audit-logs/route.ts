/**
 * Audit Logs API
 * Provides access to audit logs for administrators
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditLogsFromDB, getAuditStats, exportAuditLogs } from '@/lib/audit-logger'

/**
 * GET: Retrieve audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const params = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      entity: searchParams.get('entity') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
    }
    
    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = getAuditStats()
      return NextResponse.json({
        success: true,
        stats
      })
    }
    
    // Check if requesting export
    if (searchParams.get('export') === 'true') {
      const format = searchParams.get('format') as 'json' | 'csv' || 'json'
      const exported = exportAuditLogs({
        startDate: params.startDate,
        endDate: params.endDate,
        format
      })
      
      return new NextResponse(exported, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.${format}"`
        }
      })
    }
    
    // Get logs from database or memory
    const result = await getAuditLogsFromDB(params)
    
    return NextResponse.json({
      success: true,
      logs: result.logs,
      pagination: {
        total: result.total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < result.total
      }
    })
    
  } catch (error) {
    console.error('[Audit Logs API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve audit logs'
    }, { status: 500 })
  }
}
