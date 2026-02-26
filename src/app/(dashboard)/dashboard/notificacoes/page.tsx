'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Trash2, Filter, AlertTriangle, Info, AlertCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const selectClass = "rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"

const severidadeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min atras`
  if (diffHour < 24) return `${diffHour}h atras`
  if (diffDay < 7) return `${diffDay}d atras`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function NotificacoesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filterLida, setFilterLida] = useState('')
  const [filterSeveridade, setFilterSeveridade] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // List notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes', page, filterLida, filterSeveridade],
    queryFn: () => {
      let url = `/api/notificacoes?page=${page}&per_page=20`
      if (filterLida === 'true') url += '&lida=true'
      if (filterLida === 'false') url += '&lida=false'
      if (filterSeveridade) url += `&severidade=${filterSeveridade}`
      return api.get(url)
    },
  })

  // Summary
  const { data: resumoData } = useQuery({
    queryKey: ['notificacoes-resumo'],
    queryFn: () => api.get('/api/notificacoes/resumo'),
    refetchInterval: 60000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/notificacoes/${id}/ler`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-resumo'] })
    },
    onError: (err: any) => toast.error(err.message || 'Erro'),
  })

  const markMultipleMutation = useMutation({
    mutationFn: (ids: string[]) => api.put('/api/notificacoes/ler-multiplas', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-resumo'] })
      setSelectedIds([])
      toast.success('Notificacoes marcadas como lidas')
    },
    onError: (err: any) => toast.error(err.message || 'Erro'),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/api/notificacoes/ler-todas'),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-resumo'] })
      toast.success(`${result?.total_marcadas || 0} notificacoes marcadas como lidas`)
    },
    onError: (err: any) => toast.error(err.message || 'Erro'),
  })

  const clearMutation = useMutation({
    mutationFn: (dias: number) => api.delete(`/api/notificacoes/limpar?dias=${dias}&apenas_lidas=true`),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      toast.success(`${result?.total_deletadas || 0} notificacoes removidas`)
    },
    onError: (err: any) => toast.error(err.message || 'Erro'),
  })

  const notificacoes = data?.data || []
  const meta = data?.meta || {}
  const resumo = resumoData?.data || resumoData || {}
  const totais = resumo.totais || {}
  const recentes = resumo.recentes || {}

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    const unreadIds = notificacoes.filter((n: any) => !n.lida).map((n: any) => n.id)
    setSelectedIds(unreadIds)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificacoes</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Alertas e notificacoes do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={btnSecondary}>
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className={btnSecondary}>
            <CheckCheck className="h-4 w-4" />
            Ler Todas
          </button>
          <button onClick={() => clearMutation.mutate(30)} disabled={clearMutation.isPending} className={btnSecondary} title="Remover lidas com mais de 30 dias">
            <Trash2 className="h-4 w-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Nao Lidas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totais.nao_lidas || 0}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
          <p className="text-xs text-red-600 dark:text-red-400">Criticas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totais.critical || 0}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-3">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Avisos</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totais.warning || 0}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Info</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totais.info || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ultimas 24h</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{recentes.ultimas_24h || 0}</p>
        </div>
      </div>

      {/* Critical alerts */}
      {resumo.criticas_recentes && resumo.criticas_recentes.length > 0 && (
        <div className="mb-6 space-y-2">
          {resumo.criticas_recentes.map((n: any) => (
            <div key={n.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{n.titulo}</p>
                <p className="text-xs text-red-600 dark:text-red-400">{n.mensagem}</p>
              </div>
              <span className="text-[10px] text-red-500 whitespace-nowrap">{formatDate(n.criado_em)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select value={filterLida} onChange={(e) => { setFilterLida(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todas</option>
              <option value="false">Nao lidas</option>
              <option value="true">Lidas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Severidade</label>
            <select value={filterSeveridade} onChange={(e) => { setFilterSeveridade(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todas</option>
              <option value="critical">Critica</option>
              <option value="warning">Aviso</option>
              <option value="info">Info</option>
            </select>
          </div>
          {(filterLida || filterSeveridade) && (
            <button onClick={() => { setFilterLida(''); setFilterSeveridade(''); setPage(1) }} className="text-sm text-primary hover:text-primary/80">
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-primary font-medium">{selectedIds.length} selecionada(s)</span>
          <div className="flex gap-2">
            <button
              onClick={() => markMultipleMutation.mutate(selectedIds)}
              disabled={markMultipleMutation.isPending}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar como lidas
            </button>
            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : notificacoes.length > 0 ? (
        <div className="space-y-2">
          {notificacoes.length > 1 && (
            <div className="flex justify-end mb-1">
              <button onClick={selectAll} className="text-xs text-primary hover:text-primary/80">
                Selecionar nao lidas
              </button>
            </div>
          )}

          {notificacoes.map((notif: any) => {
            const config = severidadeConfig[notif.severidade] || severidadeConfig.info
            const Icon = config.icon
            const isSelected = selectedIds.includes(notif.id)

            return (
              <div
                key={notif.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors cursor-pointer',
                  notif.lida ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70' : `${config.bg} ${config.border}`,
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => {
                  if (!notif.lida) markReadMutation.mutate(notif.id)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(notif.id) }}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Icon className={cn('h-4 w-4 flex-shrink-0', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        'text-sm font-medium',
                        notif.lida ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                      )}>
                        {notif.titulo}
                      </p>
                      {!notif.lida && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                      )}
                      <span className={cn(
                        'inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded',
                        notif.severidade === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        notif.severidade === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}>
                        {notif.severidade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{notif.mensagem}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-500">
                      <span>{formatDate(notif.criado_em)}</span>
                      {notif.tipo && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{notif.tipo}</span>}
                      {notif.empresa_nome && <span>{notif.empresa_nome}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pagina {meta.page || page} de {meta.total_pages || 1} ({meta.total || 0} notificacoes)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className={btnSecondary}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page >= (meta.total_pages || 1)} className={btnSecondary}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma notificacao encontrada</p>
        </div>
      )}
    </div>
  )
}
