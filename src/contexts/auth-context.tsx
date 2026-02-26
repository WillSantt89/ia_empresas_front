'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { auth } from '@/lib/api'
import {
  User,
  AuthTokens,
  setAuth,
  clearAuth,
  getUser,
  isAuthenticated,
} from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
}

interface RegisterData {
  nome: string
  email: string
  senha: string
  empresa: {
    nome: string
    email: string
    telefone?: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(getUser())

  // Check authentication status
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: auth.me,
    enabled: isAuthenticated(),
    retry: false,
  })

  useEffect(() => {
    if (userData) {
      setUser(userData)
    }
  }, [userData])

  // Redirect logic
  useEffect(() => {
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    if (!isLoading) {
      if (!isAuthenticated() && !isPublicPath) {
        router.push('/login')
      } else if (isAuthenticated() && isPublicPath) {
        router.push('/dashboard')
      }
    }
  }, [pathname, isLoading, router])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      senha,
      remember,
    }: {
      email: string
      senha: string
      remember: boolean
    }) => {
      const response = await auth.login({ email, senha })
      return { response, remember }
    },
    onSuccess: ({ response, remember }) => {
      const tokens = {
        access_token: response.token,
        refresh_token: response.refreshToken,
        expires_in: 86400,
      }
      const user = response.usuario
      setAuth(tokens, user, remember)
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao fazer login')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) =>
      auth.register({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      }),
    onSuccess: () => {
      toast.success('Conta criada com sucesso! Faça login para continuar.')
      router.push('/login')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conta')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      clearAuth()
      setUser(null)
      queryClient.clear()
      toast.success('Logout realizado com sucesso')
      router.push('/login')
    },
    onError: () => {
      // Even if API fails, clear local data
      clearAuth()
      setUser(null)
      queryClient.clear()
      router.push('/login')
    },
  })

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: isAuthenticated() && !!user,
    login: async (email, password, remember = false) => {
      await loginMutation.mutateAsync({ email, senha: password, remember })
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
    register: async (data) => {
      await registerMutation.mutateAsync(data)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}