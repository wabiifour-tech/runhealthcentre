/**
 * Error Handling Utility
 * Provides consistent error handling with generic user messages
 * Logs detailed errors server-side only
 */

import { NextResponse } from 'next/server'
import { createLogger } from './logger'

const logger = createLogger('ErrorHandler')

// Error types for classification
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

// User-friendly error messages (generic, no internal details)
const USER_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Invalid request. Please check your input and try again.',
  [ErrorType.AUTHENTICATION]: 'Authentication required. Please log in to continue.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.DATABASE]: 'A database error occurred. Please try again later.',
  [ErrorType.EXTERNAL_SERVICE]: 'An external service is unavailable. Please try again later.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorType.INTERNAL]: 'An unexpected error occurred. Please try again later.'
}

// HTTP status codes for error types
const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.DATABASE]: 503,
  [ErrorType.EXTERNAL_SERVICE]: 502,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.INTERNAL]: 500
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  type: ErrorType
  statusCode: number
  userMessage: string
  internalDetails?: string
  data?: Record<string, unknown>

  constructor(
    type: ErrorType,
    options: {
      message?: string
      userMessage?: string
      internalDetails?: string
      statusCode?: number
      data?: Record<string, unknown>
    } = {}
  ) {
    super(options.message || type)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = options.statusCode || ERROR_STATUS_CODES[type]
    this.userMessage = options.userMessage || USER_MESSAGES[type]
    this.internalDetails = options.internalDetails
    this.data = options.data
  }
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: Error | ApiError | unknown,
  context?: { module?: string; operation?: string }
): NextResponse {
  // Handle known API errors
  if (error instanceof ApiError) {
    // Log detailed error server-side
    logger.error(`${context?.module || 'API'}: ${error.type}`, {
      operation: context?.operation,
      type: error.type,
      internalDetails: error.internalDetails,
      stack: error.stack,
      data: error.data
    })

    // Return generic message to user
    return NextResponse.json(
      {
        success: false,
        error: error.userMessage,
        code: error.type
      },
      { status: error.statusCode }
    )
  }

  // Handle Prisma/database errors
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()
    
    // Database connection errors
    if (errorMessage.includes('connection') || errorMessage.includes('econnrefused') || errorMessage.includes('etimedout')) {
      logger.error(`${context?.module || 'API'}: Database connection error`, {
        operation: context?.operation,
        error: error.message,
        stack: error.stack
      })
      
      return NextResponse.json(
        {
          success: false,
          error: USER_MESSAGES[ErrorType.DATABASE],
          code: ErrorType.DATABASE
        },
        { status: 503 }
      )
    }

    // Unique constraint violations
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      logger.error(`${context?.module || 'API'}: Duplicate entry error`, {
        operation: context?.operation,
        error: error.message
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'This record already exists.',
          code: ErrorType.VALIDATION
        },
        { status: 400 }
      )
    }

    // Foreign key errors
    if (errorMessage.includes('foreign key') || errorMessage.includes('references')) {
      logger.error(`${context?.module || 'API'}: Foreign key constraint error`, {
        operation: context?.operation,
        error: error.message
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Referenced record not found.',
          code: ErrorType.VALIDATION
        },
        { status: 400 }
      )
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      logger.error(`${context?.module || 'API'}: Validation error`, {
        operation: context?.operation,
        error: error.message
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input provided. Please check your data.',
          code: ErrorType.VALIDATION
        },
        { status: 400 }
      )
    }
  }

  // Unknown error - log full details, return generic message
  logger.error(`${context?.module || 'API'}: Unexpected error`, {
    operation: context?.operation,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })

  return NextResponse.json(
    {
      success: false,
      error: USER_MESSAGES[ErrorType.INTERNAL],
      code: ErrorType.INTERNAL
    },
    { status: 500 }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  options: { message?: string; status?: number } = {}
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data
    },
    { status: options.status || 200 }
  )
}

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: { module: string; operation: string }
): Promise<NextResponse> {
  return handler().catch((error) => errorResponse(error, context))
}

/**
 * Quick error creators
 */
export const Errors = {
  validation: (message?: string, data?: Record<string, unknown>) => 
    new ApiError(ErrorType.VALIDATION, { userMessage: message, data }),
  
  unauthorized: (message?: string) => 
    new ApiError(ErrorType.AUTHENTICATION, { userMessage: message }),
  
  forbidden: (message?: string) => 
    new ApiError(ErrorType.AUTHORIZATION, { userMessage: message }),
  
  notFound: (resource?: string) => 
    new ApiError(ErrorType.NOT_FOUND, { 
      userMessage: resource ? `${resource} not found.` : USER_MESSAGES[ErrorType.NOT_FOUND] 
    }),
  
  database: (internalDetails?: string) => 
    new ApiError(ErrorType.DATABASE, { internalDetails }),
  
  rateLimit: (retryAfter?: number) => 
    new ApiError(ErrorType.RATE_LIMIT, { 
      data: retryAfter ? { retryAfter } : undefined 
    }),
  
  internal: (internalDetails?: string) => 
    new ApiError(ErrorType.INTERNAL, { internalDetails })
}
