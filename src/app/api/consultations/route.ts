/**
 * Consultation API Routes - Enterprise Architecture
 * 
 * RESTful endpoints for consultation management
 */

import { NextRequest } from 'next/server'
import { consultationService } from '@/modules/consultations/services/consultation.service'
import { consultationRepository } from '@/modules/consultations/repositories/consultation.repository'
import { consultationCreateSchema, consultationUpdateSchema, paginationSchema, formatZodErrors, safeValidate } from '@/validators/schemas'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'
import { createLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'
import { getPrisma } from '@/lib/db'

const logger = createLogger('ConsultationAPI')

function getContext(request: NextRequest, user?: { id: string; name: string; role: string }) {
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
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'ConsultationAPI' })
    }
    
    const { searchParams } = new URL(request.url)
    const context = getContext(request, authResult.user)
    
    const id = searchParams.get('id')
    if (id) {
      const consultation = await consultationService.getById(id, context)
      if (!consultation) {
        return errorResponse(Errors.notFound('Consultation'), { 
          module: 'ConsultationAPI', 
          requestId: context.requestId 
        })
      }
      return successResponse({ consultation }, { requestId: context.requestId })
    }
    
    if (searchParams.get('statistics') === 'true') {
      const doctorId = searchParams.get('doctorId') || undefined
      const stats = await consultationService.getStatistics(doctorId, context)
      return successResponse({ statistics: stats }, { requestId: context.requestId })
    }
    
    if (searchParams.get('queue') === 'true') {
      const referredTo = searchParams.get('referredTo') || undefined
      const consultations = await consultationRepository.getPendingConsultations(referredTo)
      return successResponse({ consultations }, { requestId: context.requestId })
    }
    
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    })
    
    const searchOptions = {
      ...pagination,
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') || undefined,
      referredTo: searchParams.get('referredTo') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    }
    
    const result = await consultationRepository.search(searchOptions)
    
    return successResponse(result, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in GET /api/consultations', { error: String(error) })
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'ConsultationAPI' })
    }
    
    const context = getContext(request, authResult.user)
    const body = await request.json()
    
    const action = body.action
    
    if (action === 'start') {
      const { consultationId } = body
      if (!consultationId) {
        return errorResponse(Errors.validation('Consultation ID is required'), { 
          module: 'ConsultationAPI', 
          requestId: context.requestId 
        })
      }
      
      const consultation = await consultationService.startConsultation(
        consultationId, context.userId!, context.userName!, context
      )
      
      return successResponse({ consultation, message: 'Consultation started' }, { requestId: context.requestId })
    }
    
    if (action === 'complete') {
      const { consultationId, ...data } = body
      if (!consultationId) {
        return errorResponse(Errors.validation('Consultation ID is required'), { 
          module: 'ConsultationAPI', 
          requestId: context.requestId 
        })
      }
      
      const consultation = await consultationService.completeConsultation(consultationId, data, context)
      return successResponse({ consultation, message: 'Consultation completed' }, { requestId: context.requestId })
    }
    
    if (action === 'route') {
      const { consultationId, referredTo, notes } = body
      if (!consultationId || !referredTo) {
        return errorResponse(Errors.validation('Consultation ID and referredTo are required'), { 
          module: 'ConsultationAPI', 
          requestId: context.requestId 
        })
      }
      
      const consultation = await consultationService.routeConsultation(consultationId, referredTo, notes, context)
      
      await createRoutingNotification(consultationId, referredTo, context)
      
      return successResponse({ consultation, message: 'Consultation routed successfully' }, { requestId: context.requestId })
    }
    
    const validation = safeValidate(consultationCreateSchema, body)
    if (!validation.success) {
      return errorResponse(
        Errors.validation('Invalid consultation data', formatZodErrors(validation.errors)), 
        { module: 'ConsultationAPI', requestId: context.requestId }
      )
    }
    
    await consultationService.validateCreate(validation.data, context)
    
    const consultation = await consultationService.create({
      ...validation.data,
      doctorId: context.userId,
      doctorName: context.userName
    }, context)
    
    await createNewConsultationNotification(consultation.id!, validation.data.patientId!, context)
    
    logger.info('Consultation created via API', { 
      consultationId: consultation.id, 
      patientId: consultation.patientId,
      createdBy: context.userId 
    })
    
    return successResponse({ 
      consultation, 
      message: 'Consultation created successfully'
    }, { status: 201, requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in POST /api/consultations', { error: String(error) })
    return errorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'ConsultationAPI' })
    }
    
    const context = getContext(request, authResult.user)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return errorResponse(Errors.validation('Consultation ID is required'), { 
        module: 'ConsultationAPI', 
        requestId: context.requestId 
      })
    }
    
    const body = await request.json()
    
    const validation = safeValidate(consultationUpdateSchema, body)
    if (!validation.success) {
      return errorResponse(
        Errors.validation('Invalid consultation data', formatZodErrors(validation.errors)), 
        { module: 'ConsultationAPI', requestId: context.requestId }
      )
    }
    
    const consultation = await consultationService.update(id, validation.data, context)
    
    logger.info('Consultation updated via API', { consultationId: consultation.id, updatedBy: context.userId })
    
    return successResponse({ consultation, message: 'Consultation updated successfully' }, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in PUT /api/consultations', { error: String(error) })
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(Errors.unauthorized(authResult.error), { module: 'ConsultationAPI' })
    }
    
    const context = getContext(request, authResult.user)
    
    // Only admins can delete
    if (!['SUPER_ADMIN', 'ADMIN'].includes(authResult.user.role)) {
      return errorResponse(Errors.forbidden('Only administrators can delete consultations'), { 
        module: 'ConsultationAPI', 
        requestId: context.requestId 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return errorResponse(Errors.validation('Consultation ID is required'), { 
        module: 'ConsultationAPI', 
        requestId: context.requestId 
      })
    }
    
    await consultationService.delete(id, context)
    
    logger.warn('Consultation deleted', { consultationId: id, deletedBy: context.userId })
    
    return successResponse({ message: 'Consultation deleted' }, { requestId: context.requestId })
    
  } catch (error) {
    logger.error('Error in DELETE /api/consultations', { error: String(error) })
    return errorResponse(error)
  }
}

// Helper functions
async function createNewConsultationNotification(consultationId: string, patientId: string, context: any) {
  try {
    const prisma = await getPrisma()
    const p = prisma as any
    
    const doctors = await p.users.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true }
    })
    
    for (const doc of doctors) {
      await p.notifications.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: doc.id,
          type: 'new_consultation',
          title: 'New Patient Consultation',
          message: `A new patient consultation is pending`,
          data: { consultationId, patientId },
          read: false
        }
      })
    }
    
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'consultation_created',
        data: { consultationId, patientId }
      })
    }).catch(() => {})
  } catch (e) {
    logger.debug('Failed to create notification', { error: String(e) })
  }
}

async function createRoutingNotification(consultationId: string, referredTo: string, context: any) {
  try {
    const prisma = await getPrisma()
    const p = prisma as any
    
    const roleMap: Record<string, string> = {
      'pharmacy': 'PHARMACIST',
      'lab': 'LAB_TECHNICIAN',
      'nurse': 'NURSE',
      'records': 'RECORDS_OFFICER',
      'matron': 'MATRON'
    }
    
    const targetRole = roleMap[referredTo.toLowerCase()] || referredTo.toUpperCase()
    
    const users = await p.users.findMany({
      where: { role: targetRole, isActive: true },
      select: { id: true }
    })
    
    for (const u of users) {
      await p.notifications.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: u.id,
          type: 'patient_routed',
          title: `Patient Routed to ${referredTo}`,
          message: `A patient has been routed to your department`,
          data: { consultationId, referredTo },
          read: false
        }
      })
    }
    
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'consultation_routed',
        data: { consultationId, referredTo }
      })
    }).catch(() => {})
  } catch (e) {
    logger.debug('Failed to create routing notification', { error: String(e) })
  }
}
