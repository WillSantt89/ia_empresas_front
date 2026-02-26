'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Search, User, Bot } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['conversas', search],
    queryFn: () => api.get(`/api/conversas?search=${search}`),
  })

  const statusLabels: Record<string, string> = {
    ativo: 'Ativo',
    finalizado: 'Finalizado',
    timeout: 'Timeout',
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    finalizado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    timeout: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }

  const controlColors: Record<string, string> = {
    ia: 'text-blue-600 dark:text-blue-400',
    humano: 'text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversas</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitore e gerencie as conversas ativas
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(data) ? data : [])?.map((conversa: any) => (
            <div key={conversa.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {conversa.agente_nome || conversa.inbox_nome || 'Desconhecido'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {conversa.total_mensagens || 0} mensagens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn('flex items-center gap-1 text-xs font-medium', controlColors[conversa.controlado_por] || controlColors.ia)}>
                    {conversa.controlado_por === 'ia' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {conversa.controlado_por === 'ia' ? 'IA' : 'Humano'}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[conversa.status] || statusColors.ativo}`}>
                    {statusLabels[conversa.status] || conversa.status}
                  </span>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              Nenhuma conversa encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}
