'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, Search, Filter, Download, AlertTriangle, Bot, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const selectClass = "rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function LogsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [agenteFilter, setAgenteFilter] = useState('')
  const [direcaoFilter, setDirecaoFilter] = useState('')
  const [erroFilter, setErroFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, agenteFilter, direcaoFilter, erroFilter],
    queryFn: () => {
      let url = `/api/logs?page=${page}&per_page=30`
      if (agenteFilter) url += `&agente_id=${agenteFilter}`
      if (direcaoFilter) url += `&direcao=${direcaoFilter}`
      if (erroFilter === 'true') url += `&com_erro=true`
      if (erroFilter === 'false') url += `&com_erro=false`
      return api.get(url)
    },
  })

  // Load agents for filter
  const { data: agentesData } = useQuery({
    queryKey: ['agentes-list'],
    queryFn: () => api.get('/api/agentes?limit=100'),
    staleTime: 5 * 60 * 1000,
  })

  const logs = data?.data || []
  const meta = data?.meta || {}
  const stats = meta.estatisticas || {}
  const agentes = agentesData?.agents || []

  const handleExport = async (formato: 'csv' | 'json') => {
    try {
      const url = `/api/logs/export?formato=${formato}&incluir_conteudo=true`
      const result = await api.get(url)
      // For CSV, create download
      if (formato === 'csv' && typeof result === 'string') {
        const blob = new Blob([result], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'logs_export.csv'
        a.click()
      } else {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'logs_export.json'
        a.click()
      }
      toast.success(`Exportado em ${formato.toUpperCase()}`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Historico de mensagens e interacoes dos agentes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={btnSecondary}>
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button onClick={() => handleExport('csv')} className={btnSecondary}>
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.total_tokens > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{meta.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tokens</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{((stats.total_tokens || 0) / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Latencia media</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(stats.latencia_media_ms || 0)}ms</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Erros</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.total_erros || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Conversas</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.conversas_unicas || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Agente</label>
            <select value={agenteFilter} onChange={(e) => { setAgenteFilter(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todos</option>
              {agentes.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Direcao</label>
            <select value={direcaoFilter} onChange={(e) => { setDirecaoFilter(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todas</option>
              <option value="entrada">Entrada (cliente)</option>
              <option value="saida">Saida (agente)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Erros</label>
            <select value={erroFilter} onChange={(e) => { setErroFilter(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todos</option>
              <option value="true">Com erro</option>
              <option value="false">Sem erro</option>
            </select>
          </div>
          {(agenteFilter || direcaoFilter || erroFilter) && (
            <button onClick={() => { setAgenteFilter(''); setDirecaoFilter(''); setErroFilter(''); setPage(1) }} className="text-sm text-primary hover:text-primary/80">
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Logs table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dir</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conteudo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tokens</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Latencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {logs.map((log: any) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer ${log.tem_erro ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(log.criado_em)}</td>
                      <td className="px-4 py-3">
                        {log.direcao === 'entrada'
                          ? <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><User className="h-3 w-3" />In</span>
                          : <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><Bot className="h-3 w-3" />Out</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{log.agente_nome || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white max-w-[300px] truncate">
                        {log.conteudo_truncado || log.conteudo?.substring(0, 100) || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                        {log.total_tokens || ((log.tokens_input || 0) + (log.tokens_output || 0))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                        {log.latencia_ms ? `${log.latencia_ms}ms` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.tem_erro || log.erro
                          ? <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" />Erro</span>
                          : <span className="text-xs text-green-600 dark:text-green-400">OK</span>
                        }
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={7} className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30">
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-4 text-xs">
                              <div><span className="text-gray-500">Modelo:</span> <span className="font-mono text-gray-900 dark:text-white">{log.modelo_usado || '-'}</span></div>
                              <div><span className="text-gray-500">Conversa CW:</span> <span className="font-mono text-gray-900 dark:text-white">#{log.conversation_id_chatwoot || '-'}</span></div>
                              <div><span className="text-gray-500">Contato:</span> <span className="text-gray-900 dark:text-white">{log.contato_whatsapp || '-'}</span></div>
                              <div><span className="text-gray-500">Tokens:</span> <span className="font-mono text-gray-900 dark:text-white">{log.tokens_input || 0}in / {log.tokens_output || 0}out</span></div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Conteudo completo:</p>
                              <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 max-h-40 overflow-y-auto">
                                {log.conteudo || 'Sem conteudo'}
                              </pre>
                            </div>
                            {log.erro && (
                              <div>
                                <p className="text-xs text-red-500 mb-1">Erro:</p>
                                <pre className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">{log.erro}</pre>
                              </div>
                            )}
                            {log.tools_invocadas && log.tools_invocadas.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Tools invocadas:</p>
                                <div className="flex gap-1 flex-wrap">
                                  {log.tools_invocadas.map((t: any, i: number) => (
                                    <span key={i} className="px-2 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                      {typeof t === 'string' ? t : t.name || 'tool'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pagina {meta.page || page} de {meta.total_pages || 1} ({meta.total || 0} registros)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={btnSecondary}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= (meta.total_pages || 1)}
                className={btnSecondary}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum log encontrado</p>
        </div>
      )}
    </div>
  )
}
