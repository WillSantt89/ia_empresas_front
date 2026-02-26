import { getAuthToken, getRefreshToken, removeAuthToken, setAuthToken, setRefreshToken, clearAuth } from '@/lib/auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:3001'

interface RequestOptions extends RequestInit {
  token?: string
  skipAuth?: boolean
  _retried?: boolean
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()
    const result = data.data || data

    if (result.token) {
      setAuthToken(result.token)
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
      }
      return true
    }
    return false
  } catch {
    return false
  }
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }
  isRefreshing = true
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false
    refreshPromise = null
  })
  return refreshPromise
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth = false, _retried = false, ...init } = options

  const authToken = token || getAuthToken()

  const config: RequestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      ...(authToken && !skipAuth ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)

    if (response.status === 401 && !skipAuth && !_retried) {
      // Try to refresh the token before giving up
      const refreshed = await refreshTokenIfNeeded()
      if (refreshed) {
        // Retry the original request with new token
        return request<T>(endpoint, { ...options, _retried: true })
      }

      // Refresh failed - clear auth and redirect
      clearAuth()
      window.location.href = '/login'
      throw new ApiError(401, 'Sessao expirada', 'UNAUTHORIZED')
    }

    if (response.status === 401) {
      clearAuth()
      window.location.href = '/login'
      throw new ApiError(401, 'Sessao expirada', 'UNAUTHORIZED')
    }

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error?.message || 'Request failed',
        data.error?.code,
        data.error?.details
      )
    }

    return data.data || data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(0, 'Erro de conexao. Verifique sua internet.', 'NETWORK_ERROR')
    }

    throw new ApiError(500, 'Erro inesperado', 'UNKNOWN_ERROR')
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

// Auth endpoints
export const auth = {
  login: (data: { email: string; senha: string }) =>
    api.post('/api/auth/login', data, { skipAuth: true }),

  register: (data: { nome: string; email: string; senha: string }) =>
    api.post('/api/auth/register', data, { skipAuth: true }),

  logout: () => api.post('/api/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }, { skipAuth: true }),

  me: () => api.get('/api/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (data: { token: string; novaSenha: string }) =>
    api.post('/api/auth/reset-password', data, { skipAuth: true }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/api/usuarios/change-password', data),
}
