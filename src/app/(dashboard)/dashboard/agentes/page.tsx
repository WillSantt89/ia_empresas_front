'use client'

import { useQuery } from '@tanstack/react-query'
import { Bot, Plus, Search, Zap } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function AgentesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['agentes', search],
    queryFn: () => api.get(`/api/agentes?search=${search}`),
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agentes IA</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure e gerencie seus agentes de inteligência artificial
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Agente
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.agents?.map((agente: any) => (
            <div key={agente.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${agente.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {agente.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{agente.nome}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {agente.descricao || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{agente.tool_count || 0} tools</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{agente.modelo || 'gemini'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                  Configurar
                </button>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              Nenhum agente encontrado
            </div>
          )}
        </div>
      )}
    </div>
  )
}
