'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Clock,
  Zap,
  Bot,
  Wrench,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const selectClass = "rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const inputClass = "rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"

const intervals = [
  { value: 'hour', label: 'Por Hora' },
  { value: 'day', label: 'Por Dia' },
  { value: 'week', label: 'Por Semana' },
  { value: 'month', label: 'Por Mes' },
]

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export default function AnalyticsPage() {
  const defaults = getDefaultDates()
  const [startDate, setStartDate] = useState(defaults.start_date)
  const [endDate, setEndDate] = useState(defaults.end_date)
  const [interval, setInterval] = useState('day')
  const [agenteId, setAgenteId] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [tab, setTab] = useState<'overview' | 'timeline' | 'tools' | 'conversations'>('overview')
  const [convPage, setConvPage] = useState(1)

  const dateParams = `start_date=${startDate}&end_date=${endDate}${agenteId ? `&agente_id=${agenteId}` : ''}`

  // Overview
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['analytics', 'overview', startDate, endDate, agenteId],
    queryFn: () => api.get(`/api/analytics/overview?${dateParams}`),
  })

  // Usage
  const { data: usageData } = useQuery({
    queryKey: ['analytics', 'usage'],
    queryFn: () => api.get('/api/analytics/usage'),
  })

  // Timeline
  const { data: timelineData } = useQuery({
    queryKey: ['analytics', 'timeline', startDate, endDate, agenteId, interval],
    queryFn: () => api.get(`/api/analytics/timeline?${dateParams}&interval=${interval}`),
    enabled: tab === 'timeline',
  })

  // Tools
  const { data: toolsData } = useQuery({
    queryKey: ['analytics', 'tools', startDate, endDate, agenteId],
    queryFn: () => api.get(`/api/analytics/tools?${dateParams}`),
    enabled: tab === 'tools',
  })

  // Conversations
  const { data: convsData } = useQuery({
    queryKey: ['analytics', 'conversations', startDate, endDate, agenteId, convPage],
    queryFn: () => api.get(`/api/analytics/conversations?${dateParams}&page=${convPage}&limit=20`),
    enabled: tab === 'conversations',
  })

  // Agents list for filter
  const { data: agentesData } = useQuery({
    queryKey: ['agentes-list'],
    queryFn: () => api.get('/api/agentes?limit=100'),
    staleTime: 5 * 60 * 1000,
  })

  const overview = overviewData?.overview || overviewData?.data?.overview || {}
  const usage = usageData?.usage || usageData?.data?.usage || {}
  const timeline = timelineData?.timeline || timelineData?.data?.timeline || []
  const tools = toolsData?.tools || toolsData?.data?.tools || []
  const convs = convsData?.conversations || convsData?.data?.conversations || []
  const convsPag = convsData?.pagination || convsData?.data?.pagination || {}
  const agentes = agentesData?.agents || []

  const handleExport = async (type: string) => {
    try {
      const result = await api.post('/api/analytics/export', {
        type,
        start_date: startDate,
        end_date: endDate,
        format: 'csv',
      })
      const blob = new Blob([typeof result === 'string' ? result : JSON.stringify(result, null, 2)], {
        type: typeof result === 'string' ? 'text/csv' : 'application/json'
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `analytics_${type}_${startDate}_${endDate}.${typeof result === 'string' ? 'csv' : 'json'}`
      a.click()
      toast.success('Exportado!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Metricas e estatisticas detalhadas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={btnSecondary}>
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button onClick={() => handleExport(tab === 'tools' ? 'tools' : tab === 'conversations' ? 'conversations' : 'overview')} className={btnSecondary}>
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Agente</label>
            <select value={agenteId} onChange={(e) => setAgenteId(e.target.value)} className={selectClass}>
              <option value="">Todos</option>
              {agentes.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          {tab === 'timeline' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Intervalo</label>
              <select value={interval} onChange={(e) => setInterval(e.target.value)} className={selectClass}>
                {intervals.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'overview', label: 'Visao Geral', icon: BarChart3 },
          { key: 'timeline', label: 'Timeline', icon: TrendingUp },
          { key: 'tools', label: 'Tools', icon: Wrench },
          { key: 'conversations', label: 'Conversas', icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard icon={MessageSquare} label="Mensagens" value={overview.total_messages} color="blue" />
                <StatCard icon={TrendingUp} label="Taxa Sucesso" value={`${overview.success_rate || 0}%`} color="green" />
                <StatCard icon={Clock} label="Latencia Media" value={`${overview.avg_response_time || 0}ms`} color="purple" />
                <StatCard icon={Zap} label="Tokens" value={formatNum(overview.total_tokens)} color="orange" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Messages breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resumo de Mensagens</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sucesso</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{(overview.successful_messages || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Erros</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">{(overview.failed_messages || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tool Calls</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{(overview.total_tool_calls || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Conversas</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{(overview.total_conversations || 0).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Usage limits */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Uso vs Limites</h3>
                  <div className="space-y-4">
                    {usage.mensagens && (
                      <UsageBar label="Mensagens" used={usage.mensagens.used} max={usage.mensagens.limit} pct={usage.mensagens.percentage} color="blue" />
                    )}
                    {usage.tokens && (
                      <UsageBar label="Tokens" used={usage.tokens.used} max={usage.tokens.limit} pct={usage.tokens.percentage} color="orange" />
                    )}
                    {usage.usuarios && (
                      <UsageBar label="Usuarios" used={usage.usuarios.used} max={usage.usuarios.limit} pct={usage.usuarios.percentage} color="green" />
                    )}
                    {usage.agentes && (
                      <UsageBar label="Agentes" used={usage.agentes.used} max={usage.agentes.limit} pct={usage.agentes.percentage} color="purple" />
                    )}
                  </div>
                </div>
              </div>

              {/* Top Agents */}
              {overview.agents && overview.agents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agentes</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Agente</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Conversas</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Mensagens</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tokens</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Sucesso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {overview.agents.map((ag: any) => (
                          <tr key={ag.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">{ag.nome}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{ag.conversations}</td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{ag.messages}</td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono">{formatNum(ag.tokens)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={cn(
                                'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full',
                                ag.success_rate >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                ag.success_rate >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}>
                                {Math.round(ag.success_rate)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Timeline ({intervals.find(i => i.value === interval)?.label})
          </h3>
          {timeline.length > 0 ? (
            <>
              {/* Visual bar chart */}
              <div className="mb-6">
                <div className="flex items-end gap-1 h-40">
                  {timeline.map((t: any, i: number) => {
                    const maxMsgs = Math.max(...timeline.map((x: any) => x.messages || 0), 1)
                    const height = ((t.messages || 0) / maxMsgs) * 100
                    return (
                      <div key={i} className="flex-1 group relative flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-300 min-h-[2px]"
                          style={{ height: `${Math.max(height, 1)}%` }}
                        />
                        <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap z-10">
                          <p>{formatPeriod(t.period, interval)}</p>
                          <p>Msgs: {t.messages}</p>
                          <p>Conv: {t.conversations}</p>
                          <p>Tokens: {formatNum(t.tokens)}</p>
                          <p>Sucesso: {t.success_rate}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {timeline.map((t: any, i: number) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate block">
                        {formatPeriodShort(t.period, interval)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Periodo</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Conversas</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Mensagens</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tokens</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Latencia</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Sucesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {timeline.map((t: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">{formatPeriod(t.period, interval)}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.conversations}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.messages}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-mono">{formatNum(t.tokens)}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{t.avg_response_time || 0}ms</td>
                        <td className="px-3 py-2 text-right">
                          <span className={cn(
                            'text-xs font-semibold',
                            t.success_rate >= 90 ? 'text-green-600 dark:text-green-400' :
                            t.success_rate >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          )}>
                            {t.success_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Nenhum dado no periodo selecionado</p>
          )}
        </div>
      )}

      {/* Tools Tab */}
      {tab === 'tools' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance das Tools</h3>
          </div>
          {tools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tool</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Chamadas</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Sucesso</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Erros</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Taxa</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Duracao Media</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Agentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {tools.map((t: any) => (
                    <tr key={t.id || t.nome}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{t.nome}</span>
                            {t.descricao && <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.descricao}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-semibold">{t.total_calls}</td>
                      <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{t.successful_calls}</td>
                      <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{t.failed_calls}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full',
                          t.success_rate >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          t.success_rate >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {t.success_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {t.avg_duration || 0}ms
                        <span className="text-gray-400"> (max: {t.max_duration || 0}ms)</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(t.used_by_agents || []).map((a: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">{a}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma tool utilizada no periodo</p>
            </div>
          )}
        </div>
      )}

      {/* Conversations Tab */}
      {tab === 'conversations' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Conversas ({convsPag.total || 0})</h3>
          </div>
          {convs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Conversa</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Inicio</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Duracao</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Msgs</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tokens</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Latencia</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tools</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Sucesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {convs.map((c: any) => (
                      <tr key={c.conversation_id}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{c.conversation_id?.substring(0, 8)}...</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDateTime(c.first_message)}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.duration_minutes || 0}min</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.message_count}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">{formatNum(c.total_tokens)}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.avg_response_time || 0}ms</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.tool_calls || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'text-xs font-semibold',
                            c.success_rate >= 90 ? 'text-green-600 dark:text-green-400' :
                            c.success_rate >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          )}>
                            {c.success_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pagina {convsPag.page || convPage} de {convsPag.pages || 1}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConvPage(Math.max(1, convPage - 1))} disabled={convPage <= 1} className={btnSecondary}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConvPage(convPage + 1)} disabled={convPage >= (convsPag.pages || 1)} className={btnSecondary}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa no periodo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center gap-3">
      <div className={cn('rounded-md p-2.5', colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
      </div>
    </div>
  )
}

function UsageBar({ label, used, max, pct, color }: { label: string; used: number; max: number; pct: number; color: string }) {
  const barColors: Record<string, string> = { blue: 'bg-blue-500', orange: 'bg-orange-500', green: 'bg-green-500', purple: 'bg-purple-500' }
  const effectiveColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : barColors[color] || 'bg-blue-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={cn('font-semibold', pct > 90 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
        <div className={cn('h-2 rounded-full transition-all', effectiveColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        {Number(used).toLocaleString('pt-BR')} / {Number(max).toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

function formatNum(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('pt-BR')
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatPeriod(dateStr: string, interval: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (interval === 'hour') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  if (interval === 'month') return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatPeriodShort(dateStr: string, interval: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (interval === 'hour') return `${d.getHours()}h`
  if (interval === 'month') return d.toLocaleDateString('pt-BR', { month: 'short' })
  return `${d.getDate()}/${d.getMonth() + 1}`
}
