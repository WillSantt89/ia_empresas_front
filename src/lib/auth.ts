import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export interface User {
  id: string
  nome: string
  email: string
  role: 'master' | 'admin' | 'operador' | 'viewer'
  empresa_id: string
  empresa_nome?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Token management
export function setAuthToken(token: string, remember = false) {
  const options = remember ? { expires: 30 } : undefined // 30 days if remember
  Cookies.set(TOKEN_KEY, token, options)
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function removeAuthToken() {
  Cookies.remove(TOKEN_KEY)
}

// Refresh token management
export function setRefreshToken(token: string, remember = false) {
  const options = remember ? { expires: 30 } : undefined
  Cookies.set(REFRESH_TOKEN_KEY, token, options)
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY)
}

export function removeRefreshToken() {
  Cookies.remove(REFRESH_TOKEN_KEY)
}

// User management
export function setUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null

  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

// Complete auth management
export function setAuth(tokens: AuthTokens, user: User, remember = false) {
  setAuthToken(tokens.access_token, remember)
  setRefreshToken(tokens.refresh_token, remember)
  setUser(user)
}

export function clearAuth() {
  removeAuthToken()
  removeRefreshToken()
  removeUser()
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

// Permission checks
export function hasPermission(
  user: User | null,
  allowedRoles: Array<'master' | 'admin' | 'operador' | 'viewer'>
): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

export function canManageUsers(user: User | null): boolean {
  return hasPermission(user, ['master', 'admin'])
}

export function canManageAgents(user: User | null): boolean {
  return hasPermission(user, ['master', 'admin'])
}

export function canViewAnalytics(user: User | null): boolean {
  return hasPermission(user, ['master', 'admin', 'operador'])
}

export function canUseChat(user: User | null): boolean {
  return hasPermission(user, ['master', 'admin', 'operador'])
}

export function isReadOnly(user: User | null): boolean {
  return user?.role === 'viewer'
}