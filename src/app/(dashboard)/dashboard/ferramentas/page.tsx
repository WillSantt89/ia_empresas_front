'use client'

import { useQuery } from '@tanstack/react-query'
import { Wrench, Plus, Search, Globe, Lock } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function FerramentasPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tools', search],
    queryFn: () => api.get(`/api/tools?search=${search}`),
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ferramentas</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie as ferramentas e integrações dos agentes
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nova Ferramenta
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ferramentas..."
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
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.tools?.map((tool: any) => (
            <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {tool.global ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{tool.global ? 'Global' : 'Privada'}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{tool.nome}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {tool.descricao || 'Sem descrição'}
              </p>
              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                {tool.method} {tool.url}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">Editar</button>
                <button className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">Testar</button>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              Nenhuma ferramenta encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}
