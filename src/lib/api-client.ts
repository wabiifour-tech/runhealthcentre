/**
 * API Client with Authentication Headers
 * Used by frontend to make authenticated requests to API routes
 */

// Get user from localStorage
export function getAuthUser(): { id: string; email: string; name: string; role: string; department?: string; initials?: string } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Build headers with authentication
export function getAuthHeaders(): HeadersInit {
  const user = getAuthUser()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-email'] = user.email
    headers['x-user-name'] = encodeURIComponent(user.name || '')
    headers['x-user-role'] = user.role
    if (user.department) headers['x-user-department'] = user.department
    if (user.initials) headers['x-user-initials'] = user.initials
  }
  
  return headers
}

// Authenticated fetch wrapper
export async function authFetch<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Request failed' 
    }
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string) => authFetch<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body: any) => authFetch<T>(url, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  put: <T = any>(url: string, body: any) => authFetch<T>(url, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  }),
  delete: <T = any>(url: string) => authFetch<T>(url, { method: 'DELETE' }),
}

// Check if user has required role
export function hasRole(requiredRole: string): boolean {
  const user = getAuthUser()
  if (!user) return false
  
  const roleHierarchy: Record<string, number> = {
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
  
  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

// Check if user is admin
export function isAdmin(): boolean {
  const user = getAuthUser()
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}

// Check if user is super admin
export function isSuperAdmin(): boolean {
  const user = getAuthUser()
  return user?.role === 'SUPER_ADMIN'
}
