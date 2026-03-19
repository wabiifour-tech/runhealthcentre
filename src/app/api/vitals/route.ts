/**
 * Vitals API Routes
 * 
 * RESTful endpoints for vital signs management
 */

import { NextRequest } from 'next/server'
import { vitalsService } from '@/modules/triage/services/vitals.service'
import { vitalSignsRepository } from '@/modules/triage/repositories/vitals.repository'
import { vitalSignsCreateSchema, paginationSchema, formatZodErrors, safeValidate } from '@/validators/schemas'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'

const logger = createLogger('VitalsAPI')

function getContext(request: NextRequest, user?: any) {
  return {
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    requestId: nanoid(8)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    const context = getContext(request, user)
    
    const id = searchParams.get('id')
    if (id) {
      const vitals = await vitalsService.getById(id, context)
      if (!vitals) {
        return errorResponse(Errors.notFound('Vital signs record'), { 
          module: 'VitalsAPI', 
          requestId: context.requestId 
        })
      }
      return successResponse({ vitals }, { requestId: context.requestId })
    }
    
    const patientId = searchParams.get('patientId')
    if (patientId && searchParams.get('latest') === 'true') {
      const vitals = await vitalSignsRepository.getLatestForPatient(patientId)
      return successResponse({ vitals }, { requestId: context.requestId })
    }
    
    if (patientId && searchParams.get('stats') === 'true') {
      const stats = await vitalSignsRepository.getPatientStats(patientId)
      return successResponse({ statistics: stats }, { requestId: context.requestId })
    }
    
    if (searchParams.get('today') === 'true') {
      const vitals = await vitalSignsRepository.getTodayVitals()
      return successResponse({ vitals }, { requestId: context.requestId })
    }
    
    if (patientId) {
      const vitals = await vitalsService.getByPatientId(patientId, context)
      return successResponse({ vitals }, { requestId: context.requestId })
    }
    
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    })
    
    const searchOptions = {
      ...pagination,
      recordedBy: searchParams.get('recordedBy') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    }
    
    const result = await vitalSignsRepository.search(searchOptions)
    
    return successResponse(result, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in GET /api/vitals', { error: String(error) })
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const context = getContext(request, user)
    const body = await request.json()
    
    const validation = safeValidate(vitalSignsCreateSchema, body)
    if (!validation.success) {
      return errorResponse(
        Errors.validation('Invalid vitals data', formatZodErrors(validation.errors)), 
        { module: 'VitalsAPI', requestId: context.requestId }
      )
    }
    
    await vitalsService.validateCreate(validation.data, context)
    
    const vitals = await vitalsService.create({
      ...validation.data,
      recordedBy: context.userId
    }, context)
    
    logger.info('Vitals recorded via API', { 
      vitalsId: vitals.id, 
      patientId: vitals.patientId,
      recordedBy: context.userId 
    })
    
    return successResponse({ 
      vitals, 
      message: 'Vital signs recorded successfully'
    }, { status: 201, requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in POST /api/vitals', { error: String(error) })
    return errorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const context = getContext(request, user)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return errorResponse(Errors.validation('Vital signs ID is required'), { 
        module: 'VitalsAPI', 
        requestId: context.requestId 
      })
    }
    
    const body = await request.json()
    const vitals = await vitalsService.update(id, body, context)
    
    logger.info('Vitals updated via API', { vitalsId: vitals.id, updatedBy: context.userId })
    
    return successResponse({ 
      vitals, 
      message: 'Vital signs updated successfully'
    }, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in PUT /api/vitals', { error: String(error) })
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'VitalsAPI' })
    }
    const context = getContext(request, authResult.user)
    
    if (!['SUPER_ADMIN', 'ADMIN', 'MATRON'].includes(authResult.user.role)) {
      return errorResponse(Errors.forbidden('Only administrators can delete vital signs records'), { 
        module: 'VitalsAPI', 
        requestId: context.requestId 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return errorResponse(Errors.validation('Vital signs ID is required'), { 
        module: 'VitalsAPI', 
        requestId: context.requestId 
      })
    }
    
    await vitalsService.delete(id, context)
    
    logger.warn('Vitals deleted', { vitalsId: id, deletedBy: context.userId })
    
    return successResponse({ message: 'Vital signs record deleted' }, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in DELETE /api/vitals', { error: String(error) })
    return errorResponse(error)
  }
}
