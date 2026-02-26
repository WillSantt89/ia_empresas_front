'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, Users, Bot, Key } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

export default function EmpresasPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['empresa', 'me'],
    queryFn: () => api.get('/api/empresas/me'),
  })

  const { data: statsData } = useQuery({
    queryKey: ['empresa', 'stats'],
    queryFn: () => api.get('/api/empresas/stats'),
  })

  const empresa = data?.empresa
  const limits = data?.limits
  const usage = data?.usage
  const stats = statsData

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresa</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Informações e estatísticas da sua empresa
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{empresa?.nome}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{empresa?.email}</p>
                <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${empresa?.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {empresa?.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Telefone:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa?.telefone || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa?.documento || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Endereço:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa?.endereco || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Criado em:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa?.created_at ? new Date(empresa.created_at).toLocaleDateString('pt-BR') : '-'}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage?.usuarios_ativos || 0} / {limits?.max_usuarios || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-green-100 dark:bg-green-900/30">
                  <Bot className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Agentes</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage?.agentes_ativos || 0} / {limits?.max_agentes || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-purple-100 dark:bg-purple-900/30">
                  <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mensagens/Mês</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage?.mensagens_processadas?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">de {limits?.max_mensagens_mes?.toLocaleString('pt-BR') || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-orange-100 dark:bg-orange-900/30">
                  <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tokens/Mês</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {usage?.tokens_usados?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">de {limits?.max_tokens_mes?.toLocaleString('pt-BR') || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
