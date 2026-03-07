/**
 * Authentication Middleware for API Routes
 * Provides role-based access control and authentication verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from './db'

// User roles hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 100,
  'ADMIN': 80,
  'DOCTOR': 60,
  'MATRON': 50,
  'NURSE': 40,
  'PHARMACIST': 40,
  'LAB_TECHNICIAN': 40,
  'RECORDS_OFFICER': 30,
  'STUDENT': 10
}

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'SUPER_ADMIN': ['all'],
  'ADMIN': ['manage_users', 'view_reports', 'manage_settings', 'view_patients', 'edit_patients', 'view_consultations', 'edit_consultations', 'view_labs', 'edit_labs', 'view_pharmacy', 'edit_pharmacy', 'view_audit'],
  'DOCTOR': ['view_patients', 'edit_patients', 'view_consultations', 'edit_consultations', 'view_labs', 'request_labs', 'view_pharmacy', 'prescribe'],
  'MATRON': ['view_patients', 'edit_patients', 'view_consultations', 'view_labs', 'view_pharmacy', 'manage_nurses'],
  'NURSE': ['view_patients', 'edit_vitals', 'view_consultations', 'view_labs'],
  'PHARMACIST': ['view_pharmacy', 'edit_pharmacy', 'dispense', 'view_prescriptions'],
  'LAB_TECHNICIAN': ['view_labs', 'edit_labs', 'upload_results'],
  'RECORDS_OFFICER': ['view_patients', 'register_patients', 'edit_patients', 'view_appointments'],
  'STUDENT': ['view_own_records']
}

// Session interface
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  department?: string
  initials?: string
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthUser
  error?: string
  statusCode?: number
}

/**
 * Extract user info from request headers
 * The frontend sends user info in headers after login
 */
function extractUserFromHeaders(request: NextRequest): AuthUser | null {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')
  const userName = request.headers.get('x-user-name')
  const userRole = request.headers.get('x-user-role')
  const userDepartment = request.headers.get('x-user-department')
  const userInitials = request.headers.get('x-user-initials')

  if (!userId || !userEmail || !userRole) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    name: userName || '',
    role: userRole,
    department: userDepartment || undefined,
    initials: userInitials || undefined
  }
}

/**
 * Verify user session from database
 */
async function verifyUserSession(userId: string): Promise<AuthUser | null> {
  try {
    const prisma = await getPrisma()
    if (!prisma) return null

    const p = prisma as any
    const user = await p.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        initials: true,
        isActive: true,
        approvalStatus: true
      }
    })

    if (!user) return null
    if (!user.isActive) return null
    if (user.approvalStatus !== 'APPROVED') return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      initials: user.initials
    }
  } catch {
    return null
  }
}

/**
 * Check if a role has sufficient privilege level
 */
export function hasRoleLevel(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes('all') || permissions.includes(permission)
}

/**
 * Check if user is admin or super admin
 */
export function isAdmin(userRole: string): boolean {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
}

/**
 * Authentication middleware for API routes
 * Usage: const authResult = await authenticateRequest(request, { requiredRole: 'ADMIN' })
 */
export async function authenticateRequest(
  request: NextRequest,
  options: {
    requiredRole?: string
    requiredPermission?: string
    requireAdmin?: boolean
    allowUnauthenticated?: boolean
  } = {}
): Promise<AuthResult> {
  const { requiredRole, requiredPermission, requireAdmin, allowUnauthenticated } = options

  // Extract user from headers
  const headerUser = extractUserFromHeaders(request)

  // If no user in headers and unauthenticated access not allowed
  if (!headerUser && !allowUnauthenticated) {
    return {
      authenticated: false,
      error: 'Authentication required',
      statusCode: 401
    }
  }

  // If unauthenticated access is allowed
  if (!headerUser && allowUnauthenticated) {
    return {
      authenticated: false,
      user: undefined
    }
  }

  // Verify session in database (optional but recommended for sensitive operations)
  const dbUser = headerUser ? await verifyUserSession(headerUser.id) : null

  if (headerUser && !dbUser) {
    return {
      authenticated: false,
      error: 'Session expired or invalid',
      statusCode: 401
    }
  }

  const user = dbUser || headerUser

  // Check role requirement
  if (requiredRole && user && !hasRoleLevel(user.role, requiredRole)) {
    return {
      authenticated: false,
      error: 'Insufficient privileges',
      statusCode: 403
    }
  }

  // Check admin requirement
  if (requireAdmin && user && !isAdmin(user.role)) {
    return {
      authenticated: false,
      error: 'Admin access required',
      statusCode: 403
    }
  }

  // Check permission requirement
  if (requiredPermission && user && !hasPermission(user.role, requiredPermission)) {
    return {
      authenticated: false,
      error: 'Permission denied',
      statusCode: 403
    }
  }

  return {
    authenticated: true,
    user: user || undefined
  }
}

/**
 * Wrapper for API route handlers with authentication
 * Usage: export const GET = withAuth(async (request, user) => { ... }, { requireAdmin: true })
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser | null) => Promise<NextResponse>,
  options: {
    requiredRole?: string
    requiredPermission?: string
    requireAdmin?: boolean
    allowUnauthenticated?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request, options)

    if (!authResult.authenticated && !options.allowUnauthenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: authResult.statusCode || 401 }
      )
    }

    return handler(request, authResult.user || null)
  }
}

/**
 * Higher-order function for admin-only routes
 */
export function adminOnly(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAdmin: true })
}

/**
 * Higher-order function for super admin-only routes
 */
export function superAdminOnly(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRole: 'SUPER_ADMIN' })
}

/**
 * Create unauthorized response
 */
export function unauthorized(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

/**
 * Create forbidden response
 */
export function forbidden(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}
