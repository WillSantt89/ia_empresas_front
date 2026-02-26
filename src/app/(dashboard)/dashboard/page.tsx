'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Bot,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

interface OverviewData {
  overview: {
    total_conversations: number
    total_messages: number
    successful_messages: number
    failed_messages: number
    total_tokens: number
    total_tool_calls: number
    avg_response_time: number
    success_rate: number
    message_limit: number
    token_limit: number
    agents: Array<{
      id: string
      nome: string
      conversations: number
      messages: number
      tokens: number
      success_rate: number
    }>
  }
}

const stats = [
  {
    name: 'Conversas Ativas',
    key: 'total_conversations',
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'Taxa de Sucesso',
    key: 'success_rate',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    format: (value: number) => `${value}%`,
  },
  {
    name: 'Tempo de Resposta',
    key: 'avg_response_time',
    icon: Clock,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    format: (value: number) => `${value}ms`,
  },
  {
    name: 'Tokens Usados',
    key: 'total_tokens',
    icon: Zap,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    format: (value: number) => value.toLocaleString('pt-BR'),
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  // Fetch overview data
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview'),
  })

  // Fetch usage data
  const { data: usageData } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: () => api.get('/analytics/usage'),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const overview = data?.overview

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Bem-vindo(a) de volta, {user?.nome}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const value = overview?.[stat.key as keyof typeof overview] || 0
          const formattedValue = stat.format
            ? stat.format(value as number)
            : value.toLocaleString('pt-BR')

          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={cn('rounded-md p-3', stat.bgColor)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formattedValue}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Messages Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumo de Mensagens
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mensagens Bem-sucedidas
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {overview?.successful_messages.toLocaleString('pt-BR') || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mensagens com Erro
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {overview?.failed_messages.toLocaleString('pt-BR') || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Mensagens
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {overview?.total_messages.toLocaleString('pt-BR') || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Uso vs Limites
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mensagens
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {usageData?.usage?.mensagens?.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(usageData?.usage?.mensagens?.percentage || 0, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {usageData?.usage?.mensagens?.used.toLocaleString('pt-BR') || 0} /{' '}
                {usageData?.usage?.mensagens?.limit.toLocaleString('pt-BR') || 0}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tokens
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {usageData?.usage?.tokens?.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(usageData?.usage?.tokens?.percentage || 0, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {usageData?.usage?.tokens?.used.toLocaleString('pt-BR') || 0} /{' '}
                {usageData?.usage?.tokens?.limit.toLocaleString('pt-BR') || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      {overview?.agents && overview.agents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agentes Mais Ativos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conversas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mensagens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taxa de Sucesso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {overview.agents.slice(0, 5).map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {agent.nome}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.conversations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.messages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.tokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex px-2 text-xs leading-5 font-semibold rounded-full',
                          agent.success_rate >= 90
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : agent.success_rate >= 70
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {Math.round(agent.success_rate)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}