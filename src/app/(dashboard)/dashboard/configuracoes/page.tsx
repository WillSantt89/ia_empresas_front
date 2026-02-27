'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, User, Building2, Shield, Headphones, Save, Loader2, Globe, TestTube, Webhook, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"

function Section({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canEdit = user?.role === 'master' || user?.role === 'admin'

  // Load configuracoes
  const { data: configData, isLoading } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => api.get('/api/configuracoes'),
  })

  const config = configData?.data || configData || {}

  // Form states
  const [empresaNome, setEmpresaNome] = useState('')
  const [chatwootUrl, setChatwootUrl] = useState('')
  const [chatwootToken, setChatwootToken] = useState('')
  const [chatwootAccountId, setChatwootAccountId] = useState('')
  const [chatwootAdminEmail, setChatwootAdminEmail] = useState('')

  const [n8nResponseUrl, setN8nResponseUrl] = useState('')
  const [showToken, setShowToken] = useState(false)

  const [controleTimeout, setControleTimeout] = useState(30)
  const [controleMsgRetorno, setControleMsgRetorno] = useState('')
  const [controleDevNota, setControleDevNota] = useState(true)
  const [controleCmdAssumir, setControleCmdAssumir] = useState('/assumir')
  const [controleCmdDevolver, setControleCmdDevolver] = useState('/devolver')
  const [controleNotifAssumir, setControleNotifAssumir] = useState(true)
  const [controleNotifDevolver, setControleNotifDevolver] = useState(true)
  const [controleAtivo, setControleAtivo] = useState(true)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirmar, setSenhaConfirmar] = useState('')

  // Sync form with loaded data
  useEffect(() => {
    if (config.empresa) {
      setEmpresaNome(config.empresa.nome || '')
    }
    if (config.chatwoot) {
      setChatwootUrl(config.chatwoot.url || '')
      setChatwootAccountId(config.chatwoot.account_id?.toString() || '')
      setChatwootAdminEmail(config.chatwoot.admin_email || '')
    }
    if (config.n8n) {
      setN8nResponseUrl(config.n8n.n8n_response_url || '')
    }
    if (config.controle_humano) {
      const ch = config.controle_humano
      setControleTimeout(ch.timeout_inatividade_minutos || 30)
      setControleMsgRetorno(ch.mensagem_retorno_ia || '')
      setControleDevNota(ch.permitir_devolver_via_nota !== false)
      setControleCmdAssumir(ch.comando_assumir || '/assumir')
      setControleCmdDevolver(ch.comando_devolver || '/devolver')
      setControleNotifAssumir(ch.notificar_admin_ao_assumir !== false)
      setControleNotifDevolver(ch.notificar_admin_ao_devolver !== false)
      setControleAtivo(ch.ativo !== false)
    }
  }, [config.empresa?.nome, config.chatwoot?.url, config.controle_humano?.timeout_inatividade_minutos])

  // Save empresa
  const saveEmpresaMutation = useMutation({
    mutationFn: () => api.put('/api/configuracoes', { empresa: { nome: empresaNome } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      toast.success('Dados da empresa salvos!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar'),
  })

  // Save chatwoot
  const saveChatwootMutation = useMutation({
    mutationFn: () => api.put('/api/configuracoes', {
      chatwoot: {
        url: chatwootUrl || undefined,
        account_id: chatwootAccountId ? parseInt(chatwootAccountId) : undefined,
        admin_email: chatwootAdminEmail || undefined,
        ...(chatwootToken ? { api_token: chatwootToken } : {}),
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      setChatwootToken('')
      toast.success('Chatwoot configurado!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar Chatwoot'),
  })

  // Test chatwoot
  const testChatwootMutation = useMutation({
    mutationFn: () => api.post('/api/configuracoes/chatwoot/testar', {}),
    onSuccess: (data: any) => {
      const result = data?.data || data
      if (result?.status === 'connected') {
        toast.success('Conexao com Chatwoot OK!')
      } else {
        toast.error(result?.message || 'Erro na conexao')
      }
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao testar Chatwoot'),
  })

  // Generate n8n token
  const generateTokenMutation = useMutation({
    mutationFn: () => api.put('/api/configuracoes', { n8n: { gerar_token: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      toast.success('Token gerado com sucesso!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao gerar token'),
  })

  // Save n8n response URL
  const saveN8nMutation = useMutation({
    mutationFn: () => api.put('/api/configuracoes', {
      n8n: { n8n_response_url: n8nResponseUrl || undefined }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      toast.success('Configuracao n8n salva!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar n8n'),
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`)
    }).catch(() => {
      toast.error('Falha ao copiar')
    })
  }

  // Save controle humano
  const saveControleMutation = useMutation({
    mutationFn: () => api.put('/api/configuracoes', {
      controle_humano: {
        timeout_inatividade_minutos: controleTimeout,
        mensagem_retorno_ia: controleMsgRetorno,
        permitir_devolver_via_nota: controleDevNota,
        comando_assumir: controleCmdAssumir,
        comando_devolver: controleCmdDevolver,
        notificar_admin_ao_assumir: controleNotifAssumir,
        notificar_admin_ao_devolver: controleNotifDevolver,
        ativo: controleAtivo,
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      toast.success('Controle humano salvo!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar controle humano'),
  })

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: () => api.post('/api/usuarios/change-password', {
      current_password: senhaAtual,
      new_password: senhaNova,
    }),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setSenhaNova('')
      setSenhaConfirmar('')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao alterar senha'),
  })

  const handleChangePassword = () => {
    if (!senhaAtual || !senhaNova) {
      toast.error('Preencha a senha atual e nova senha')
      return
    }
    if (senhaNova.length < 6) {
      toast.error('A nova senha deve ter no minimo 6 caracteres')
      return
    }
    if (senhaNova !== senhaConfirmar) {
      toast.error('As senhas nao conferem')
      return
    }
    changePasswordMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracoes</h1>
        </div>
        <div className="space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracoes</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Gerencie as configuracoes da sua conta e empresa
        </p>
      </div>

      <div className="space-y-6">
        {/* Perfil */}
        <Section icon={User} title="Perfil">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
              <input type="text" value={user?.nome || ''} disabled className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={user?.email || ''} disabled className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input type="text" value={user?.role || ''} disabled className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
              <input type="text" value={user?.empresa_nome || config.empresa?.nome || ''} disabled className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
            </div>
          </div>
        </Section>

        {/* Empresa */}
        {canEdit && (
          <Section
            icon={Building2}
            title="Empresa"
            action={
              <button onClick={() => saveEmpresaMutation.mutate()} disabled={saveEmpresaMutation.isPending} className={btnPrimary}>
                {saveEmpresaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                <input type="text" value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano</label>
                <input type="text" value={config.plano?.nome || 'Nao definido'} disabled className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
              </div>
            </div>
            {config.plano?.limites && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Usuarios</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.plano.uso_atual?.usuarios || 0} / {config.plano.limites.max_usuarios || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tools</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.plano.uso_atual?.tools || 0} / {config.plano.limites.max_tools || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mensagens/mes</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.plano.uso_atual?.mensagens_mes || 0} / {config.plano.limites.max_mensagens_mes || '-'}</p>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Chatwoot */}
        {canEdit && (
          <Section
            icon={Globe}
            title="Chatwoot"
            action={
              <div className="flex gap-2">
                <button onClick={() => testChatwootMutation.mutate()} disabled={testChatwootMutation.isPending} className={btnSecondary}>
                  {testChatwootMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  Testar
                </button>
                <button onClick={() => saveChatwootMutation.mutate()} disabled={saveChatwootMutation.isPending} className={btnPrimary}>
                  {saveChatwootMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </div>
            }
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex h-2 w-2 rounded-full ${config.chatwoot?.configurado ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {config.chatwoot?.configurado ? 'Configurado' : 'Nao configurado'}
              </span>
              {config.chatwoot?.status && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  config.chatwoot.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  config.chatwoot.status === 'erro' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {config.chatwoot.status}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Chatwoot</label>
                <input type="text" value={chatwootUrl} onChange={(e) => setChatwootUrl(e.target.value)} className={inputClass} placeholder="https://chatwoot.empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account ID</label>
                <input type="text" value={chatwootAccountId} onChange={(e) => setChatwootAccountId(e.target.value)} className={inputClass} placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token <span className="text-xs text-gray-400">(deixe vazio para manter)</span></label>
                <input type="password" value={chatwootToken} onChange={(e) => setChatwootToken(e.target.value)} className={inputClass} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Admin</label>
                <input type="email" value={chatwootAdminEmail} onChange={(e) => setChatwootAdminEmail(e.target.value)} className={inputClass} placeholder="admin@empresa.com" />
              </div>
            </div>
          </Section>
        )}

        {/* Webhook n8n */}
        {canEdit && (
          <Section
            icon={Webhook}
            title="Webhook n8n"
            action={
              <button onClick={() => saveN8nMutation.mutate()} disabled={saveN8nMutation.isPending} className={btnPrimary}>
                {saveN8nMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            }
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex h-2 w-2 rounded-full ${config.n8n?.configurado ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {config.n8n?.configurado ? 'Token configurado' : 'Token nao gerado'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do Webhook</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.n8n?.webhook_url || 'Gere um token primeiro'}
                    readOnly
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-default"
                  />
                  {config.n8n?.webhook_url && (
                    <button
                      onClick={() => copyToClipboard(config.n8n.webhook_url, 'URL')}
                      className={btnSecondary}
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token de Autenticacao</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={config.n8n?.webhook_token || ''}
                      readOnly
                      placeholder="Nenhum token gerado"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 py-2 pr-10 text-sm text-gray-700 dark:text-gray-300 cursor-default"
                    />
                    {config.n8n?.webhook_token && (
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {config.n8n?.webhook_token && (
                    <button
                      onClick={() => copyToClipboard(config.n8n.webhook_token, 'Token')}
                      className={btnSecondary}
                      title="Copiar token"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (config.n8n?.webhook_token) {
                        if (!confirm('Gerar novo token vai invalidar o token atual. Continuar?')) return
                      }
                      generateTokenMutation.mutate()
                    }}
                    disabled={generateTokenMutation.isPending}
                    className={btnSecondary}
                    title={config.n8n?.webhook_token ? 'Regenerar token' : 'Gerar token'}
                  >
                    {generateTokenMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {config.n8n?.webhook_token ? 'Regenerar' : 'Gerar'}
                  </button>
                </div>
              </div>

              {/* Response URL (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de Resposta n8n <span className="text-xs text-gray-400">(opcional, para modo assincrono)</span>
                </label>
                <input
                  type="text"
                  value={n8nResponseUrl}
                  onChange={(e) => setN8nResponseUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://n8n.empresa.com/webhook/..."
                />
              </div>

              {/* Instructions */}
              {config.n8n?.configurado && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Como configurar no n8n:</p>
                  <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Adicione um node HTTP Request no n8n</li>
                    <li>Configure como POST para a URL do webhook acima</li>
                    <li>Adicione o header: <code className="bg-blue-100 dark:bg-blue-800/40 px-1 rounded">x-webhook-token: {'{'}seu token{'}'}</code></li>
                    <li>No body (JSON), envie: <code className="bg-blue-100 dark:bg-blue-800/40 px-1 rounded">{'{ "message": "...", "phone": "5511...", "name": "..." }'}</code></li>
                    <li>A resposta da IA vira em <code className="bg-blue-100 dark:bg-blue-800/40 px-1 rounded">data.response</code></li>
                  </ol>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Controle Humano */}
        {canEdit && (
          <Section
            icon={Headphones}
            title="Controle Humano"
            action={
              <button onClick={() => saveControleMutation.mutate()} disabled={saveControleMutation.isPending} className={btnPrimary}>
                {saveControleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            }
          >
            <div className="space-y-4">
              <Toggle checked={controleAtivo} onChange={setControleAtivo} label="Controle humano ativo" description="Permite que humanos assumam conversas da IA" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeout de inatividade (minutos)</label>
                  <input type="number" min={5} max={1440} value={controleTimeout} onChange={(e) => setControleTimeout(parseInt(e.target.value) || 30)} className={inputClass} />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Apos este tempo sem interacao humana, a IA reassume</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem de retorno da IA</label>
                  <input type="text" value={controleMsgRetorno} onChange={(e) => setControleMsgRetorno(e.target.value)} className={inputClass} placeholder="Voltei! Como posso ajudar?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comando assumir</label>
                  <input type="text" value={controleCmdAssumir} onChange={(e) => setControleCmdAssumir(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comando devolver</label>
                  <input type="text" value={controleCmdDevolver} onChange={(e) => setControleCmdDevolver(e.target.value)} className={inputClass} />
                </div>
              </div>

              <Toggle checked={controleDevNota} onChange={setControleDevNota} label="Permitir devolver via nota" description="Operadores podem devolver o controle usando nota interna no Chatwoot" />
              <Toggle checked={controleNotifAssumir} onChange={setControleNotifAssumir} label="Notificar admin ao assumir" description="Envia notificacao quando humano assume conversa" />
              <Toggle checked={controleNotifDevolver} onChange={setControleNotifDevolver} label="Notificar admin ao devolver" description="Envia notificacao quando humano devolve conversa" />
            </div>
          </Section>
        )}

        {/* Seguranca */}
        <Section icon={Shield} title="Alterar Senha">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Atual</label>
              <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
              <input type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nova Senha</label>
              <input type="password" value={senhaConfirmar} onChange={(e) => setSenhaConfirmar(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className={btnPrimary}>
              {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Alterar Senha
            </button>
          </div>
        </Section>

        {/* Uso */}
        {config.estatisticas_uso && (
          <Section icon={Settings} title="Uso do Mes">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.estatisticas_uso.mensagens_mes || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mensagens</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{((config.estatisticas_uso.tokens_mes || 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tokens</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.estatisticas_uso.tool_calls_mes || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tool Calls</p>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
