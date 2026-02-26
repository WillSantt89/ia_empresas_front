'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Search, User, Bot, X, ArrowLeft, UserCheck, RotateCcw, XCircle, Clock, ChevronDown, Filter } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

const statusLabels: Record<string, string> = { ativo: 'Ativo', finalizado: 'Finalizado', timeout: 'Timeout' }
const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  finalizado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  timeout: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function ChatPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [controlFilter, setControlFilter] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const canControl = user?.role === 'master' || user?.role === 'admin' || user?.role === 'operador'

  const { data, isLoading } = useQuery({
    queryKey: ['conversas', search, statusFilter, controlFilter],
    queryFn: () => {
      let url = '/api/conversas?per_page=50'
      if (statusFilter) url += `&status=${statusFilter}`
      if (controlFilter) url += `&controlado_por=${controlFilter}`
      return api.get(url)
    },
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['conversa-detail', selectedId],
    queryFn: () => api.get(`/api/conversas/${selectedId}?include_messages=true&messages_limit=100`),
    enabled: !!selectedId,
    refetchInterval: selectedId ? 10000 : false, // Auto-refresh every 10s when viewing
  })

  const assumirMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/conversas/${id}/assumir`, { motivo: 'Assumido via painel' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversa-detail', selectedId] })
      toast.success('Conversa assumida com sucesso!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao assumir conversa'),
  })

  const devolverMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/conversas/${id}/devolver`, { motivo: 'Devolvido via painel', enviar_mensagem_retorno: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversa-detail', selectedId] })
      toast.success('Conversa devolvida para IA!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao devolver conversa'),
  })

  const finalizarMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/conversas/${id}/finalizar`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversa-detail', selectedId] })
      toast.success('Conversa finalizada!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao finalizar conversa'),
  })

  const conversas = Array.isArray(data) ? data : data?.data || []
  const detail = detailData?.data || detailData

  // Detail view
  if (selectedId && detail) {
    const msgs = detail.mensagens_recentes || []
    const stats = detail.estatisticas || {}
    const isAtivo = detail.status === 'ativo'
    const isHumano = detail.controlado_por === 'humano'

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {detail.agente_nome || 'Conversa'}
              </h1>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[detail.status] || ''}`}>
                {statusLabels[detail.status] || detail.status}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                isHumano ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {isHumano ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                {isHumano ? `Humano: ${detail.humano_nome_atual || ''}` : 'IA'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Inbox: {detail.inbox_nome || '-'} | Chatwoot #{detail.conversation_id_chatwoot || '-'} | Criada: {formatDate(detail.criado_em)}
            </p>
          </div>

          {/* Control buttons */}
          {canControl && isAtivo && (
            <div className="flex gap-2">
              {!isHumano ? (
                <button
                  onClick={() => assumirMutation.mutate(selectedId!)}
                  disabled={assumirMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {assumirMutation.isPending ? 'Assumindo...' : 'Assumir'}
                </button>
              ) : (
                <button
                  onClick={() => devolverMutation.mutate(selectedId!)}
                  disabled={devolverMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {devolverMutation.isPending ? 'Devolvendo...' : 'Devolver p/ IA'}
                </button>
              )}
              <button
                onClick={() => { if (confirm('Tem certeza que deseja finalizar esta conversa?')) finalizarMutation.mutate(selectedId!) }}
                disabled={finalizarMutation.isPending}
                className={btnDanger}
              >
                <XCircle className="h-4 w-4" />
                Finalizar
              </button>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Mensagens</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total_mensagens || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tokens usados</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {((parseInt(stats.total_tokens_input || 0) + parseInt(stats.total_tokens_output || 0)) / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Latencia media</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.latencia_media ? `${Math.round(parseFloat(stats.latencia_media))}ms` : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tools usadas</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total_tools_usadas || 0}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Mensagens ({msgs.length})</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[500px] overflow-y-auto">
            {msgs.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                Nenhuma mensagem registrada
              </div>
            ) : (
              msgs.map((msg: any) => (
                <div key={msg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.direcao === 'entrada' ? 'bg-gray-200 dark:bg-gray-600' : 'bg-primary/20'
                    }`}>
                      {msg.direcao === 'entrada' ? <User className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : <Bot className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {msg.direcao === 'entrada' ? 'Cliente' : 'Agente'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(msg.criado_em)}</span>
                        {msg.modelo_usado && <span className="text-[10px] font-mono text-gray-400">{msg.modelo_usado}</span>}
                        {msg.latencia_ms && <span className="text-[10px] text-gray-400">{msg.latencia_ms}ms</span>}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                        {msg.conteudo}
                      </p>
                      {msg.erro && (
                        <p className="text-xs text-red-500 mt-1">Erro: {msg.erro}</p>
                      )}
                      {msg.tools_invocadas_json && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {(Array.isArray(msg.tools_invocadas_json) ? msg.tools_invocadas_json : [msg.tools_invocadas_json]).map((t: any, i: number) => (
                            <span key={i} className="inline-flex px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                              {typeof t === 'string' ? t : t.name || 'tool'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent history */}
        {detail.historico_agentes_detalhado && detail.historico_agentes_detalhado.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Historico de Agentes</h3>
            </div>
            <div className="p-4 space-y-2">
              {detail.historico_agentes_detalhado.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{h.agente_nome || h.agente_id}</span>
                  <span className="text-gray-400">({h.agente_tipo})</span>
                  {h.timestamp && <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Loading detail
  if (selectedId && detailLoading) {
    return (
      <div className="p-6">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-6">
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>)}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Conversation list
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversas</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitore e gerencie as conversas ativas
          </p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={btnSecondary}>
          <Filter className="h-4 w-4" />
          Filtros
          {(statusFilter || controlFilter) && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {(statusFilter ? 1 : 0) + (controlFilter ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="finalizado">Finalizado</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Controlado por</label>
            <select
              value={controlFilter}
              onChange={(e) => setControlFilter(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="ia">IA</option>
              <option value="humano">Humano</option>
            </select>
          </div>
          {(statusFilter || controlFilter) && (
            <button onClick={() => { setStatusFilter(''); setControlFilter('') }} className="text-sm text-primary hover:text-primary/80">
              Limpar filtros
            </button>
          )}
        </div>
      )}

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
      ) : conversas.length > 0 ? (
        <div className="space-y-3">
          {conversas.map((conversa: any) => (
            <div
              key={conversa.id}
              onClick={() => setSelectedId(conversa.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    conversa.controlado_por === 'humano' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {conversa.controlado_por === 'humano'
                      ? <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      : <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conversa.agente_nome || conversa.inbox_nome || 'Conversa'}
                      </p>
                      {conversa.humano_nome_atual && (
                        <span className="text-xs text-orange-600 dark:text-orange-400">({conversa.humano_nome_atual})</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conversa.total_mensagens || 0} msgs | Inbox: {conversa.inbox_nome || '-'} | CW #{conversa.conversation_id_chatwoot || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[conversa.status] || statusColors.ativo}`}>
                      {statusLabels[conversa.status] || conversa.status}
                    </span>
                    {conversa.ultima_mensagem_em && (
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(conversa.ultima_mensagem_em)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          Nenhuma conversa encontrada
        </div>
      )}

      {/* Pagination info */}
      {data?.meta && (
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Mostrando {conversas.length} de {data.meta.total} conversas (pagina {data.meta.page} de {data.meta.total_pages})
        </div>
      )}
    </div>
  )
}
