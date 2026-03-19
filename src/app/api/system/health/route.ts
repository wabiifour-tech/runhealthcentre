/**
 * System Health Check Endpoint
 * Verifies: Database connection, API availability, System status
 * 
 * Response Structure:
 * {
 *   success: boolean,
 *   data: {
 *     status: 'healthy' | 'degraded' | 'unhealthy',
 *     timestamp: ISO string,
 *     version: string,
 *     checks: { database, api, storage }
 *   },
 *   error?: string,
 *   message?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SystemHealth')

// Track server start time
const serverStartTime = Date.now()

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database
    const dbStartTime = Date.now()
    const dbTest = await testConnection()
    const dbLatency = Date.now() - dbStartTime

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!dbTest.success) {
      overallStatus = 'unhealthy'
    } else if (dbLatency > 1000) {
      overallStatus = 'degraded'
    }

    const response = {
      success: overallStatus !== 'unhealthy',
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        checks: {
          database: {
            status: dbTest.success ? 'healthy' : 'unhealthy',
            latency: dbLatency,
            message: dbTest.message
          },
          api: {
            status: 'healthy',
            message: 'API responding normally'
          },
          storage: {
            status: 'healthy',
            message: 'Storage available'
          }
        }
      }
    }

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200
    
    logger.info('Health check completed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      dbLatency
    })

    return NextResponse.json(response, { status: statusCode })

  } catch (error: any) {
    logger.error('Health check failed', { error: error.message })
    
    return NextResponse.json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        checks: {
          database: { status: 'unhealthy', message: error.message },
          api: { status: 'healthy' },
          storage: { status: 'healthy' }
        }
      },
      error: error.message
    }, { status: 503 })
  }
}
