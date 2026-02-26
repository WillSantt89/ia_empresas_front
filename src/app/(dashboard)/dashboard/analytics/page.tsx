'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, MessageSquare, Clock, Zap } from 'lucide-react'
import { api } from '@/lib/api'

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/api/analytics/overview'),
  })

  const { data: usageData } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: () => api.get('/api/analytics/usage'),
  })

  const overview = data?.overview

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Métricas e estatísticas detalhadas
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-blue-100 dark:bg-blue-900/30">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Mensagens</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overview?.total_messages?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overview?.success_rate || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overview?.avg_response_time || 0}ms
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-md p-3 bg-orange-100 dark:bg-orange-900/30">
                  <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overview?.total_tokens?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Uso de Mensagens
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mensagens</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {usageData?.usage?.mensagens?.percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${Math.min(usageData?.usage?.mensagens?.percentage || 0, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {usageData?.usage?.mensagens?.used?.toLocaleString('pt-BR') || 0} / {usageData?.usage?.mensagens?.limit?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tokens</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {usageData?.usage?.tokens?.percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div className="bg-orange-600 h-3 rounded-full transition-all" style={{ width: `${Math.min(usageData?.usage?.tokens?.percentage || 0, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {usageData?.usage?.tokens?.used?.toLocaleString('pt-BR') || 0} / {usageData?.usage?.tokens?.limit?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumo
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversas Ativas</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{overview?.total_conversations || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mensagens com Sucesso</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{overview?.successful_messages?.toLocaleString('pt-BR') || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mensagens com Erro</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">{overview?.failed_messages?.toLocaleString('pt-BR') || 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Tool Calls</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{overview?.total_tool_calls?.toLocaleString('pt-BR') || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
