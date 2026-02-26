'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Brain,
  LayoutDashboard,
  Users,
  Bot,
  Wrench,
  Key,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  MessageSquare,
  Phone,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Empresas', href: '/dashboard/empresas', icon: Building2, roles: ['master'] },
  { name: 'Usuários', href: '/dashboard/usuarios', icon: Users, roles: ['master', 'admin'] },
  { name: 'Agentes', href: '/dashboard/agentes', icon: Bot, roles: ['master', 'admin'] },
  { name: 'Ferramentas', href: '/dashboard/ferramentas', icon: Wrench, roles: ['master', 'admin'] },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key, roles: ['master', 'admin'] },
  { name: 'WhatsApp', href: '/dashboard/whatsapp-numbers', icon: Phone, roles: ['master', 'admin'] },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, roles: ['master', 'admin', 'operador'] },
  { name: 'Logs', href: '/dashboard/logs', icon: FileText, roles: ['master', 'admin', 'operador'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role || '')
  })

  // Prefetch data on link hover for instant navigation
  const prefetchRoute = useCallback((href: string) => {
    const prefetchMap: Record<string, { key: string[]; fn: () => Promise<any> }[]> = {
      '/dashboard': [
        { key: ['analytics', 'overview'], fn: () => api.get('/api/analytics/overview') },
      ],
      '/dashboard/empresas': [
        { key: ['empresas', '', ''], fn: () => api.get('/api/empresas') },
      ],
      '/dashboard/usuarios': [
        { key: ['usuarios', ''], fn: () => api.get('/api/usuarios?search=') },
      ],
      '/dashboard/agentes': [
        { key: ['agentes', ''], fn: () => api.get('/api/agentes?search=') },
      ],
      '/dashboard/ferramentas': [
        { key: ['tools', ''], fn: () => api.get('/api/tools?search=') },
      ],
      '/dashboard/api-keys': [
        { key: ['api-keys'], fn: () => api.get('/api/api-keys') },
      ],
      '/dashboard/whatsapp-numbers': [
        { key: ['whatsapp-numbers'], fn: () => api.get('/api/whatsapp-numbers') },
      ],
      '/dashboard/chat': [
        { key: ['conversas', ''], fn: () => api.get('/api/conversas?per_page=50') },
      ],
      '/dashboard/logs': [
        { key: ['logs', '1'], fn: () => api.get('/api/logs?page=1&per_page=30') },
      ],
      '/dashboard/analytics': [
        { key: ['analytics', 'overview'], fn: () => api.get('/api/analytics/overview') },
      ],
    }

    const queries = prefetchMap[href]
    if (queries) {
      queries.forEach(({ key, fn }) => {
        queryClient.prefetchQuery({ queryKey: key, queryFn: fn, staleTime: 5 * 60 * 1000 })
      })
    }
  }, [queryClient])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">IA Empresas</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => prefetchRoute(item.href)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-gray-500 dark:text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.nome?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="ml-auto text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">IA Empresas</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
                  onMouseEnter={() => prefetchRoute(item.href)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-gray-500 dark:text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.nome?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role} • {user?.empresa_nome || 'Empresa'}
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="ml-auto text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}