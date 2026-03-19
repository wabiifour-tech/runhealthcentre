/**
 * STABILITY PROTECTIONS - API Response Standards
 * 
 * All API responses MUST follow this consistent structure:
 * {
 *   success: boolean,
 *   data?: T,
 *   error?: string,
 *   code?: string,
 *   message?: string,
 *   requestId?: string
 * }
 */

import { NextResponse } from 'next/server'

// Standard response interface
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  requestId?: string
  timestamp?: string
}

// Pagination response
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  requestId?: string
}

// Error codes enum
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Conflict errors (409)
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONFLICT = 'CONFLICT',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Service unavailable (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE'
}

// Success response helper
export function successResponse<T>(
  data: T,
  options: {
    message?: string
    status?: number
    requestId?: string
  } = {}
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message: options.message,
    requestId: options.requestId,
    timestamp: new Date().toISOString()
  }, { status: options.status || 200 })
}

// Error response helper
export function errorResponse(
  error: string,
  options: {
    code?: ErrorCode | string
    status?: number
    requestId?: string
    details?: any
  } = {}
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error,
    code: options.code || ErrorCode.INTERNAL_ERROR,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
    data: options.details
  }, { status: options.status || 500 })
}

// Paginated response helper
export function paginatedResponse<T>(
  data: T[],
  options: {
    total: number
    page: number
    limit: number
    requestId?: string
    message?: string
  }
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(options.total / options.limit)
  
  return NextResponse.json({
    success: true,
    data,
    total: options.total,
    page: options.page,
    limit: options.limit,
    totalPages,
    hasNext: options.page < totalPages,
    hasPrev: options.page > 1,
    requestId: options.requestId,
    message: options.message
  })
}

// Validation error response
export function validationError(
  field: string,
  message: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return errorResponse(`${field}: ${message}`, {
    code: ErrorCode.VALIDATION_ERROR,
    status: 400,
    requestId
  })
}

// Not found response
export function notFoundResponse(
  resource: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, {
    code: ErrorCode.NOT_FOUND,
    status: 404,
    requestId
  })
}

// Unauthorized response
export function unauthorizedResponse(
  message: string = 'Authentication required',
  requestId?: string
): NextResponse<ApiResponse> {
  return errorResponse(message, {
    code: ErrorCode.UNAUTHORIZED,
    status: 401,
    requestId
  })
}

// Forbidden response
export function forbiddenResponse(
  message: string = 'Access denied',
  requestId?: string
): NextResponse<ApiResponse> {
  return errorResponse(message, {
    code: ErrorCode.FORBIDDEN,
    status: 403,
    requestId
  })
}
