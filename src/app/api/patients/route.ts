/**
 * Patient API Routes
 * 
 * RESTful endpoints for patient management
 */

import { NextRequest } from 'next/server'
import { patientService } from '@/modules/patients/services/patient.service'
import { patientCreateSchema, patientUpdateSchema, paginationSchema, formatZodErrors, safeValidate } from '@/validators/schemas'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'

const logger = createLogger('PatientAPI')

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
      const patient = await patientService.getById(id, context)
      if (!patient) {
        return errorResponse(Errors.notFound('Patient'), { 
          module: 'PatientAPI', 
          operation: 'getById',
          requestId: context.requestId 
        })
      }
      return successResponse({ patient }, { requestId: context.requestId })
    }
    
    const ruhcCode = searchParams.get('ruhcCode')
    if (ruhcCode) {
      const patient = await patientService.getByRuhcCode(ruhcCode, context)
      if (!patient) {
        return errorResponse(Errors.notFound('Patient'), { 
          module: 'PatientAPI', 
          requestId: context.requestId 
        })
      }
      return successResponse({ patient }, { requestId: context.requestId })
    }
    
    if (searchParams.get('statistics') === 'true') {
      const stats = await patientService.getStatistics(context)
      return successResponse({ statistics: stats }, { requestId: context.requestId })
    }
    
    if (searchParams.get('admitted') === 'true') {
      const patients = await patientService.getAdmittedPatients(context)
      return successResponse({ patients }, { requestId: context.requestId })
    }
    
    if (searchParams.get('allergies') === 'true') {
      const patients = await patientService.getPatientsWithAllergies(context)
      return successResponse({ patients }, { requestId: context.requestId })
    }
    
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    })
    
    const searchOptions = {
      ...pagination,
      search: searchParams.get('search') || undefined,
      patientType: searchParams.get('patientType') || undefined,
      gender: searchParams.get('gender') || undefined,
      bloodGroup: searchParams.get('bloodGroup') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined
    }
    
    const result = await patientService.search(searchOptions, context)
    
    return successResponse(result, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in GET /api/patients', { error: String(error) })
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const context = getContext(request, user)
    const body = await request.json()
    
    const validation = safeValidate(patientCreateSchema, body)
    if (!validation.success) {
      return errorResponse(Errors.validation('Invalid patient data', formatZodErrors(validation.errors)), { 
        module: 'PatientAPI',
        operation: 'create',
        requestId: context.requestId 
      })
    }
    
    await patientService.validateCreate(validation.data, context)
    
    const patient = await patientService.create({
      ...validation.data,
      registeredBy: context.userId
    }, context)
    
    logger.info('Patient created via API', { 
      patientId: patient.id, 
      ruhcCode: patient.ruhcCode,
      createdBy: context.userId 
    })
    
    return successResponse({ patient }, { 
      message: 'Patient registered successfully',
      status: 201,
      requestId: context.requestId 
    })
    
  } catch (error) {
    logger.error('Error in POST /api/patients', { error: String(error) })
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
      return errorResponse(Errors.validation('Patient ID is required'), { 
        module: 'PatientAPI',
        requestId: context.requestId 
      })
    }
    
    const body = await request.json()
    
    const validation = safeValidate(patientUpdateSchema, body)
    if (!validation.success) {
      return errorResponse(Errors.validation('Invalid patient data', formatZodErrors(validation.errors)), { 
        module: 'PatientAPI',
        requestId: context.requestId 
      })
    }
    
    await patientService.validateUpdate(id, validation.data, context)
    
    const patient = await patientService.update(id, validation.data, context)
    
    logger.info('Patient updated via API', { 
      patientId: patient.id, 
      updatedBy: context.userId 
    })
    
    return successResponse({ patient }, { 
      message: 'Patient updated successfully',
      requestId: context.requestId 
    })
    
  } catch (error) {
    logger.error('Error in PUT /api/patients', { error: String(error) })
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'PatientAPI' })
    }
    
    const context = getContext(request, authResult.user)
    
    if (!['SUPER_ADMIN', 'ADMIN', 'RECORDS_OFFICER'].includes(authResult.user.role)) {
      return errorResponse(Errors.forbidden('Only administrators can delete patients'), { 
        module: 'PatientAPI',
        requestId: context.requestId 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'
    
    if (!id) {
      return errorResponse(Errors.validation('Patient ID is required'), { 
        module: 'PatientAPI',
        requestId: context.requestId 
      })
    }
    
    if (permanent) {
      await patientService.delete(id, context)
      logger.warn('Patient permanently deleted', { patientId: id, deletedBy: context.userId })
    } else {
      await patientService.softDelete(id, context)
      logger.info('Patient soft deleted', { patientId: id, deletedBy: context.userId })
    }
    
    return successResponse({ 
      message: permanent ? 'Patient permanently deleted' : 'Patient deactivated'
    }, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in DELETE /api/patients', { error: String(error) })
    return errorResponse(error)
  }
}
