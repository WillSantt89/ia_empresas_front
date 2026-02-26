'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Bot,
  MessageSquare,
  TrendingUp,
  Clock,
  Zap,
  Building2,
  Phone,
  Wrench,
  AlertTriangle,
  Activity,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

const periodos = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
]

const selectClass = "rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"

export default function DashboardPage() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState('hoje')
  const isMaster = user?.role === 'master'

  // Company dashboard
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard', periodo],
    queryFn: () => api.get(`/api/dashboard?periodo=${periodo}`),
  })

  // Global dashboard (master only)
  const { data: globalData } = useQuery({
    queryKey: ['dashboard-global', periodo],
    queryFn: () => api.get(`/api/dashboard/global?periodo=${periodo}`),
    enabled: isMaster,
  })

  // Realtime metrics
  const { data: realtimeData } = useQuery({
    queryKey: ['dashboard-realtime'],
    queryFn: () => api.get('/api/dashboard/realtime'),
    refetchInterval: 30000,
  })

  const dash = dashData?.data || dashData || {}
  const metricas = dash.metricas || {}
  const limites = dash.limites || {}
  const global = globalData?.data || globalData || {}
  const realtime = realtimeData?.data || realtimeData || {}

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo(a), {user?.nome}!
          </p>
        </div>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={selectClass}>
          {periodos.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Realtime bar */}
      {(realtime.conversas_ativas > 0 || realtime.mensagens_ultima_hora > 0) && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tempo Real</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{realtime.conversas_ativas || 0}</span> conversas ativas
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{realtime.conversas_ia || 0}</span> IA
            {' / '}
            <span className="font-semibold text-orange-600 dark:text-orange-400">{realtime.conversas_humano || 0}</span> Humano
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{realtime.mensagens_ultima_hora || 0}</span> msgs/hora
          </div>
          {realtime.latencia_media_10min > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{Math.round(realtime.latencia_media_10min)}ms</span> latencia
            </div>
          )}
          {realtime.erros_ultima_hora > 0 && (
            <div className="text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              <span className="font-semibold">{realtime.erros_ultima_hora}</span> erros/hora
            </div>
          )}
        </div>
      )}

      {/* Master Global Section */}
      {isMaster && global.metricas_globais && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Visao Global da Plataforma
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <MiniCard icon={Building2} label="Empresas Ativas" value={global.metricas_globais.empresas_ativas} color="blue" />
            <MiniCard icon={Bot} label="Agentes" value={global.metricas_globais.total_agentes} color="green" />
            <MiniCard icon={Phone} label="Numeros" value={global.metricas_globais.total_numeros} color="purple" />
            <MiniCard icon={MessageSquare} label="Atendimentos" value={global.metricas_globais.total_atendimentos} color="indigo" />
            <MiniCard icon={Zap} label="Mensagens" value={global.metricas_globais.total_mensagens} color="orange" />
            <MiniCard icon={Zap} label="Tokens" value={formatNumber(global.metricas_globais.total_tokens)} color="yellow" />
          </div>

          {/* Revenue + Plan Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue */}
            {global.receita && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Receita Estimada
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Empresas pagantes</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{global.receita.empresas_pagantes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Receita Planos</span>
                    <span className="font-semibold text-gray-900 dark:text-white">R$ {formatCurrency(global.receita.receita_planos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Receita Itens</span>
                    <span className="font-semibold text-gray-900 dark:text-white">R$ {formatCurrency(global.receita.receita_itens)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">R$ {formatCurrency(global.receita.receita_total_estimada)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Distribution */}
            {global.distribuicao_planos && global.distribuicao_planos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Distribuicao de Planos
                </h3>
                <div className="space-y-3">
                  {global.distribuicao_planos.map((p: any) => (
                    <div key={p.plano} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white font-medium">{p.plano}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">R$ {formatCurrency(p.preco_base)}/mes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400">{p.empresas_ativas}/{p.empresas_total} empresas</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">R$ {formatCurrency(p.receita_base)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Companies near limits + Top companies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Companies near limit */}
            {global.empresas_limite && global.empresas_limite.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Empresas Proximo do Limite
                </h3>
                <div className="space-y-3">
                  {global.empresas_limite.map((e: any) => (
                    <div key={e.id} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-900 dark:text-white font-medium">{e.nome}</span>
                        <span className={cn(
                          'text-xs font-semibold',
                          e.percentual_uso >= 90 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                        )}>
                          {Math.round(e.percentual_uso)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                          <div
                            className={cn('h-1.5 rounded-full', e.percentual_uso >= 90 ? 'bg-red-500' : 'bg-orange-500')}
                            style={{ width: `${Math.min(e.percentual_uso, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {e.mensagens_usadas}/{e.limite}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top companies */}
            {global.top_empresas && global.top_empresas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Top Empresas (Periodo)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 dark:text-gray-400">
                        <th className="text-left pb-2">Empresa</th>
                        <th className="text-right pb-2">Atend.</th>
                        <th className="text-right pb-2">Conv.</th>
                        <th className="text-right pb-2">Msgs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {global.top_empresas.map((e: any) => (
                        <tr key={e.id}>
                          <td className="py-2 text-gray-900 dark:text-white font-medium">{e.nome}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-400">{e.atendimentos}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-400">{e.conversas}</td>
                          <td className="py-2 text-right text-gray-600 dark:text-gray-400">{e.mensagens}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Critical alerts */}
          {global.alertas_criticos && global.alertas_criticos.length > 0 && (
            <div className="mb-6 space-y-2">
              {global.alertas_criticos.map((a: any, i: number) => (
                <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{a.empresa_nome}: {a.titulo}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{a.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr className="my-8 border-gray-200 dark:border-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dashboard da Empresa</h2>
        </>
      )}

      {/* Company-level metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard icon={Bot} label="Agentes Ativos" value={metricas.recursos?.agentes_ativos ?? 0} color="green" />
        <MetricCard icon={Phone} label="Numeros WhatsApp" value={metricas.recursos?.numeros_ativos ?? 0} color="blue" />
        <MetricCard icon={MessageSquare} label="Conversas (Periodo)" value={metricas.conversas?.total_periodo ?? 0} color="indigo" />
        <MetricCard icon={Zap} label="Mensagens" value={metricas.mensagens?.total_periodo ?? 0} color="orange" />
        <MetricCard icon={Clock} label="Latencia Media" value={`${Math.round(metricas.mensagens?.latencia_media_ms ?? 0)}ms`} color="purple" />
      </div>

      {/* Conversations breakdown + Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversation stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Conversas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ativas Agora</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.conversas?.ativas_agora ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Atendimentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.atendimentos?.total_periodo ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Controladas IA</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{metricas.conversas?.controladas_ia ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Controladas Humano</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{metricas.conversas?.controladas_humano ?? 0}</p>
            </div>
          </div>
          {metricas.conversas?.taxa_transferencia > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Taxa de transferencia: <span className="font-semibold text-gray-900 dark:text-white">{metricas.conversas.taxa_transferencia}%</span>
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Uso vs Limites</h3>
          <div className="space-y-4">
            {limites.usuarios && (
              <LimitBar label="Usuarios" used={limites.usuarios.usado} max={limites.usuarios.limite} pct={limites.usuarios.percentual} />
            )}
            {limites.tools && (
              <LimitBar label="Tools" used={limites.tools.usado} max={limites.tools.limite} pct={limites.tools.percentual} />
            )}
            {limites.mensagens_mes && (
              <LimitBar label="Mensagens/Mes" used={limites.mensagens_mes.usado} max={limites.mensagens_mes.limite} pct={limites.mensagens_mes.percentual} />
            )}
          </div>
        </div>
      </div>

      {/* Agents table + Top tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Agents */}
        {dash.agentes && dash.agentes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Agente</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Atend. Hoje</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Limite</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {dash.agentes.map((ag: any) => (
                    <tr key={ag.id} className={ag.limite_atingido ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">{ag.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{ag.atendimentos_hoje}</td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{ag.limite_diario || '∞'}</td>
                      <td className="px-4 py-2 text-right">
                        {ag.limite_atingido ? (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">LIMITE</span>
                        ) : ag.percentual_uso > 0 ? (
                          <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(ag.percentual_uso)}%</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top tools */}
        {dash.top_tools && dash.top_tools.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Tools</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tool</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Chamadas</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Conversas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {dash.top_tools.map((t: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium font-mono text-xs">{t.tool_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{t.total_chamadas}</td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{t.conversas_unicas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Evolution chart (simple table) */}
      {dash.evolucao && dash.evolucao.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Evolucao</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Conversas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Atend.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Msgs</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {dash.evolucao.map((ev: any) => (
                  <tr key={ev.data}>
                    <td className="px-4 py-2 text-gray-900 dark:text-white font-mono text-xs">{ev.data}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{ev.conversas}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{ev.atendimentos}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{ev.mensagens}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{formatNumber(ev.tokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {dash.alertas && dash.alertas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Alertas</h3>
          {dash.alertas.map((a: any, i: number) => (
            <div
              key={i}
              className={cn(
                'rounded-lg p-3 flex items-start gap-3 border',
                a.severidade === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                a.severidade === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              )}
            >
              <AlertTriangle className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0',
                a.severidade === 'critical' ? 'text-red-500' :
                a.severidade === 'warning' ? 'text-yellow-500' : 'text-blue-500'
              )} />
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  a.severidade === 'critical' ? 'text-red-800 dark:text-red-300' :
                  a.severidade === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'
                )}>{a.titulo}</p>
                <p className={cn(
                  'text-xs',
                  a.severidade === 'critical' ? 'text-red-600 dark:text-red-400' :
                  a.severidade === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                )}>{a.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className={cn('rounded-md p-2 w-fit mb-2', colors[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3">
      <div className={cn('rounded-md p-2', colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

function LimitBar({ label, used, max, pct }: { label: string; used: number; max: number; pct: number }) {
  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={cn(
          'font-semibold',
          pct > 90 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
        )}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
        <div className={cn('h-2 rounded-full', barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {Number(used).toLocaleString('pt-BR')} / {Number(max).toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

function formatNumber(n: number) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatCurrency(n: number) {
  if (!n) return '0,00'
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
