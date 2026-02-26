'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, Plus, Search, X, Zap, Trash2, MessageCircle, Wrench, Send, Loader2, ArrowRightLeft, FileText, Check, Clock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto mx-4`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const selectClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const textareaClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

interface AgentForm {
  nome: string
  descricao: string
  provider: string
  modelo: string
  prompt_ativo: string
  temperatura: number
  max_tokens: number
}

const defaultForm: AgentForm = {
  nome: '',
  descricao: '',
  provider: 'google',
  modelo: 'gemini-2.0-flash-001',
  prompt_ativo: '',
  temperatura: 0.3,
  max_tokens: 2048,
}

const modelLabels: Record<string, string> = {
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview (mais avancado)',
  'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
  'gemini-3-flash-preview': 'Gemini 3 Flash Preview (rapido + inteligente)',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (economico)',
  'gemini-2.0-pro-001': 'Gemini 2.0 Pro',
  'gemini-2.0-flash-001': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  'gemini-1.5-pro': 'Gemini 1.5 Pro (legacy)',
  'gemini-1.5-flash': 'Gemini 1.5 Flash (legacy)',
  'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B (legacy)',
}

const providerLabels: Record<string, string> = {
  google: 'Google AI',
  claude: 'Anthropic Claude',
  grok: 'xAI Grok',
}

type EditTab = 'config' | 'tools' | 'transfers' | 'prompts' | 'test'

export default function AgentesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<any>(null)
  const [form, setForm] = useState<AgentForm>({ ...defaultForm })
  const [editTab, setEditTab] = useState<EditTab>('config')
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [testMessage, setTestMessage] = useState('')
  const [testMessages, setTestMessages] = useState<Array<{ role: string; content: string }>>([])
  const [transferForm, setTransferForm] = useState({ agente_destino_id: '', trigger_tipo: 'keyword', trigger_valores: '' })
  const [promptContent, setPromptContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['agentes', search],
    queryFn: () => api.get(`/api/agentes?search=${search}`),
  })

  const { data: providersData } = useQuery({
    queryKey: ['agentes-providers'],
    queryFn: () => api.get('/api/agentes/providers'),
    staleTime: 60 * 60 * 1000,
  })

  // Load all tools for linking
  const { data: toolsData } = useQuery({
    queryKey: ['tools-all'],
    queryFn: () => api.get('/api/tools?limit=100'),
    staleTime: 5 * 60 * 1000,
  })

  // Load agent detail when editing (to get current tools)
  const { data: agentDetail } = useQuery({
    queryKey: ['agente-detail', editingAgent?.id],
    queryFn: () => api.get(`/api/agentes/${editingAgent.id}`),
    enabled: !!editingAgent?.id && showEditModal,
  })

  // Load transfer rules for editing agent
  const { data: transfersData } = useQuery({
    queryKey: ['agente-transfers', editingAgent?.id],
    queryFn: () => api.get(`/api/${editingAgent.id}/transferencias`),
    enabled: !!editingAgent?.id && showEditModal && editTab === 'transfers',
  })

  // Load prompt versions for editing agent
  const { data: promptsData } = useQuery({
    queryKey: ['agente-prompts', editingAgent?.id],
    queryFn: () => api.get(`/api/agentes/${editingAgent.id}/prompts?include_content=true`),
    enabled: !!editingAgent?.id && showEditModal && editTab === 'prompts',
  })

  // Sync tools from agent detail
  useEffect(() => {
    if (agentDetail?.agent?.tools) {
      setSelectedToolIds(agentDetail.agent.tools.map((t: any) => t.id))
    } else if (agentDetail?.agent && !agentDetail.agent.tools) {
      setSelectedToolIds([])
    }
  }, [agentDetail])

  // Scroll to bottom when test messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testMessages])

  const providers = providersData?.providers || []
  const currentProvider = providers.find((p: any) => p.id === form.provider)
  const availableModels: string[] = currentProvider?.modelos || []
  const allTools = toolsData?.tools || []

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/agentes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      toast.success('Agente criado com sucesso!')
      closeCreateModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar agente'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/agentes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      toast.success('Agente atualizado com sucesso!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar agente'),
  })

  const toolsMutation = useMutation({
    mutationFn: ({ id, tool_ids }: { id: string; tool_ids: string[] }) =>
      api.post(`/api/agentes/${id}/tools`, { tool_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      queryClient.invalidateQueries({ queryKey: ['agente-detail', editingAgent?.id] })
      toast.success('Ferramentas atualizadas!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar ferramentas'),
  })

  const testMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post(`/api/agentes/${id}/test`, { message }),
    onSuccess: (data: any) => {
      setTestMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Sem resposta' }])
    },
    onError: (err: any) => {
      setTestMessages(prev => [...prev, { role: 'error', content: err.message || 'Erro ao testar agente' }])
    },
  })

  const createTransferMutation = useMutation({
    mutationFn: ({ agenteId, data }: { agenteId: string; data: any }) =>
      api.post(`/api/${agenteId}/transferencias`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-transfers', editingAgent?.id] })
      toast.success('Regra de transferencia criada!')
      setTransferForm({ agente_destino_id: '', trigger_tipo: 'keyword', trigger_valores: '' })
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar transferencia'),
  })

  const deleteTransferMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-transfers', editingAgent?.id] })
      toast.success('Regra removida!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao remover regra'),
  })

  const createPromptMutation = useMutation({
    mutationFn: ({ agenteId, data }: { agenteId: string; data: any }) =>
      api.post(`/api/agentes/${agenteId}/prompts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-prompts', editingAgent?.id] })
      toast.success('Nova versao do prompt criada!')
      setPromptContent('')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar prompt'),
  })

  const activatePromptMutation = useMutation({
    mutationFn: ({ agenteId, promptId }: { agenteId: string; promptId: string }) =>
      api.put(`/api/agentes/${agenteId}/prompts/${promptId}/ativar`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-prompts', editingAgent?.id] })
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      toast.success('Prompt ativado!')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao ativar prompt'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/agentes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      toast.success('Agente desativado com sucesso!')
      setShowDeleteModal(false)
      setEditingAgent(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao desativar agente'),
  })

  const resetForm = () => setForm({ ...defaultForm })

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const openEditModal = (agente: any) => {
    setEditingAgent(agente)
    setForm({
      nome: agente.nome || '',
      descricao: agente.descricao || '',
      provider: agente.provider || 'google',
      modelo: agente.modelo || 'gemini-2.0-flash-001',
      prompt_ativo: agente.prompt_ativo || '',
      temperatura: agente.temperatura ?? 0.3,
      max_tokens: agente.max_tokens ?? 2048,
    })
    setEditTab('config')
    setSelectedToolIds([])
    setTestMessages([])
    setTestMessage('')
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingAgent(null)
    resetForm()
    setEditTab('config')
    setSelectedToolIds([])
    setTestMessages([])
  }

  const handleProviderChange = (newProvider: string) => {
    const provider = providers.find((p: any) => p.id === newProvider)
    const firstModel = provider?.modelos?.[0] || ''
    setForm({ ...form, provider: newProvider, modelo: firstModel })
  }

  const handleCreate = () => {
    if (!form.nome || !form.prompt_ativo) {
      toast.error('Preencha nome e prompt do agente')
      return
    }
    if (form.prompt_ativo.length < 10) {
      toast.error('O prompt deve ter no minimo 10 caracteres')
      return
    }
    createMutation.mutate({
      nome: form.nome,
      descricao: form.descricao || undefined,
      provider: form.provider,
      modelo: form.modelo,
      prompt_ativo: form.prompt_ativo,
      temperatura: form.temperatura,
      max_tokens: form.max_tokens,
    })
  }

  const handleUpdate = () => {
    if (!editingAgent || !form.nome || !form.prompt_ativo) {
      toast.error('Preencha nome e prompt do agente')
      return
    }
    updateMutation.mutate({
      id: editingAgent.id,
      data: {
        nome: form.nome,
        descricao: form.descricao || undefined,
        provider: form.provider,
        modelo: form.modelo,
        prompt_ativo: form.prompt_ativo,
        temperatura: form.temperatura,
        max_tokens: form.max_tokens,
      },
    })
  }

  const handleSaveTools = () => {
    if (!editingAgent) return
    toolsMutation.mutate({ id: editingAgent.id, tool_ids: selectedToolIds })
  }

  const toggleTool = (toolId: string) => {
    setSelectedToolIds(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    )
  }

  const handleSendTest = () => {
    if (!testMessage.trim() || !editingAgent) return
    setTestMessages(prev => [...prev, { role: 'user', content: testMessage }])
    testMutation.mutate({ id: editingAgent.id, message: testMessage })
    setTestMessage('')
  }

  const handleCreateTransfer = () => {
    if (!editingAgent || !transferForm.agente_destino_id || !transferForm.trigger_valores.trim()) {
      toast.error('Preencha agente destino e valores do trigger')
      return
    }
    createTransferMutation.mutate({
      agenteId: editingAgent.id,
      data: {
        agente_destino_id: transferForm.agente_destino_id,
        trigger_tipo: transferForm.trigger_tipo,
        trigger_valores: transferForm.trigger_valores.split(',').map((v: string) => v.trim()).filter(Boolean),
      },
    })
  }

  const handleCreatePrompt = () => {
    if (!editingAgent || promptContent.length < 10) {
      toast.error('O prompt deve ter no minimo 10 caracteres')
      return
    }
    createPromptMutation.mutate({
      agenteId: editingAgent.id,
      data: { conteudo: promptContent, ativar_imediatamente: false },
    })
  }

  const canManage = user?.role === 'master' || user?.role === 'admin'

  const agentFormFields = (
    <>
      <FormField label="Nome" required>
        <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex: Atendimento WhatsApp" />
      </FormField>
      <FormField label="Descricao">
        <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Breve descricao do agente" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Provedor de IA" required>
          <select value={form.provider} onChange={(e) => handleProviderChange(e.target.value)} className={selectClass}>
            {providers.length > 0 ? providers.map((p: any) => (
              <option key={p.id} value={p.id} disabled={!p.disponivel}>
                {p.nome}{!p.disponivel ? ' (em breve)' : ''}
              </option>
            )) : (
              <option value="google">Google AI</option>
            )}
          </select>
        </FormField>
        <FormField label="Modelo" required>
          <select value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className={selectClass}>
            {availableModels.length > 0 ? availableModels.map((m: string) => (
              <option key={m} value={m}>{modelLabels[m] || m}</option>
            )) : (
              <option value={form.modelo}>{modelLabels[form.modelo] || form.modelo}</option>
            )}
          </select>
        </FormField>
      </div>
      <FormField label="Prompt do Sistema" required hint="Instrucoes que definem o comportamento do agente. Minimo 10 caracteres.">
        <textarea
          value={form.prompt_ativo}
          onChange={(e) => setForm({ ...form, prompt_ativo: e.target.value })}
          className={textareaClass}
          rows={6}
          placeholder="Voce e um assistente de atendimento ao cliente..."
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={`Temperatura: ${form.temperatura}`} hint="0 = preciso, 2 = criativo">
          <input type="range" min="0" max="2" step="0.1" value={form.temperatura} onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })} className="w-full accent-primary" />
        </FormField>
        <FormField label="Max Tokens" hint="100 - 8192">
          <input type="number" min={100} max={8192} value={form.max_tokens} onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 2048 })} className={inputClass} />
        </FormField>
      </div>
    </>
  )

  const toolsTabContent = (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Selecione as ferramentas (tools) que este agente pode usar durante as conversas.
      </p>
      {allTools.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          Nenhuma ferramenta cadastrada. Crie ferramentas no menu Ferramentas.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {allTools.map((tool: any) => (
            <label
              key={tool.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedToolIds.includes(tool.id)
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedToolIds.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tool.nome}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                    tool.metodo === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    tool.metodo === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {tool.metodo}
                  </span>
                  {tool.is_global && <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">Global</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{tool.descricao || tool.url}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {selectedToolIds.length} ferramenta{selectedToolIds.length !== 1 ? 's' : ''} selecionada{selectedToolIds.length !== 1 ? 's' : ''}
        </span>
        <button onClick={handleSaveTools} disabled={toolsMutation.isPending} className={btnPrimary}>
          {toolsMutation.isPending ? 'Salvando...' : 'Salvar Ferramentas'}
        </button>
      </div>
    </div>
  )

  const agents = data?.agents || []
  const otherAgents = agents.filter((a: any) => a.id !== editingAgent?.id && (a.ativo ?? a.is_active))
  const transfers = transfersData?.data?.transferencias || transfersData?.transferencias || []
  const prompts = promptsData?.data?.prompts || promptsData?.prompts || []
  const triggerLabels: Record<string, string> = { keyword: 'Palavra-chave', tool_result: 'Resultado de Tool', menu_opcao: 'Opcao de Menu' }

  const transfersTabContent = (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Configure regras para transferir conversas entre agentes automaticamente.
      </p>

      {/* Existing rules */}
      {transfers.length > 0 && (
        <div className="space-y-2 mb-4">
          {transfers.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{editingAgent?.nome}</span>
                  <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-primary">{t.agente_destino_nome}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">{triggerLabels[t.trigger_tipo] || t.trigger_tipo}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.trigger_valor || (t.trigger_valores || []).join(', ')}</span>
                  {!t.ativo && <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">Inativo</span>}
                </div>
              </div>
              <button
                onClick={() => deleteTransferMutation.mutate(t.id)}
                disabled={deleteTransferMutation.isPending}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New rule form */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Nova Regra</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Agente Destino</label>
            <select value={transferForm.agente_destino_id} onChange={(e) => setTransferForm({ ...transferForm, agente_destino_id: e.target.value })} className={selectClass}>
              <option value="">Selecione...</option>
              {otherAgents.map((a: any) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Trigger</label>
            <select value={transferForm.trigger_tipo} onChange={(e) => setTransferForm({ ...transferForm, trigger_tipo: e.target.value })} className={selectClass}>
              <option value="keyword">Palavra-chave</option>
              <option value="tool_result">Resultado de Tool</option>
              <option value="menu_opcao">Opcao de Menu</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valores (separados por virgula)</label>
          <input
            type="text"
            value={transferForm.trigger_valores}
            onChange={(e) => setTransferForm({ ...transferForm, trigger_valores: e.target.value })}
            className={inputClass}
            placeholder={transferForm.trigger_tipo === 'keyword' ? 'financeiro, cobrar, pagamento' : 'nome_da_tool'}
          />
        </div>
        <button onClick={handleCreateTransfer} disabled={createTransferMutation.isPending} className={btnPrimary}>
          {createTransferMutation.isPending ? 'Criando...' : 'Adicionar Regra'}
        </button>
      </div>
    </div>
  )

  const promptsTabContent = (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Versoes do prompt do sistema. Crie novas versoes e ative a desejada.
      </p>

      {/* Existing prompts */}
      {prompts.length > 0 && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {prompts.map((p: any) => (
            <div key={p.id} className={`p-3 rounded-lg border ${p.ativo ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">v{p.versao}</span>
                  {p.ativo && <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"><Check className="h-3 w-3" /> Ativo</span>}
                  {p.criado_por_nome && <span className="text-[10px] text-gray-400">por {p.criado_por_nome}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
                  {!p.ativo && (
                    <button
                      onClick={() => activatePromptMutation.mutate({ agenteId: editingAgent!.id, promptId: p.id })}
                      disabled={activatePromptMutation.isPending}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Ativar
                    </button>
                  )}
                </div>
              </div>
              {p.conteudo && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">{p.conteudo}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New prompt */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Nova Versao</h4>
        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          className={textareaClass}
          rows={5}
          placeholder="Digite o novo conteudo do prompt..."
        />
        <div className="flex justify-end mt-3">
          <button onClick={handleCreatePrompt} disabled={createPromptMutation.isPending} className={btnPrimary}>
            {createPromptMutation.isPending ? 'Criando...' : 'Criar Versao'}
          </button>
        </div>
      </div>
    </div>
  )

  const testTabContent = (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
        {testMessages.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            Envie uma mensagem para testar o agente
          </div>
        )}
        {testMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : msg.role === 'error'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {testMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendTest()}
          placeholder="Digite uma mensagem..."
          className={inputClass}
        />
        <button
          onClick={handleSendTest}
          disabled={!testMessage.trim() || testMutation.isPending}
          className={btnPrimary}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const tabClass = (tab: EditTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      editTab === tab
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agentes IA</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure e gerencie seus agentes de inteligencia artificial
          </p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Novo Agente
          </button>
        )}
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
          {data?.agents?.length > 0 ? data.agents.map((agente: any) => {
            const isActive = agente.ativo ?? agente.is_active
            return (
              <div key={agente.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{agente.nome}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                  {agente.descricao || 'Sem descricao'}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{agente.tool_count || 0} tools</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">
                    {providerLabels[agente.provider] || 'Google AI'}
                  </span>
                  <span className="text-[10px] font-mono truncate">
                    {agente.modelo || 'gemini'}
                  </span>
                </div>
                {canManage && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <div className="flex gap-3">
                      <button onClick={() => openEditModal(agente)} className="text-sm text-primary hover:text-primary/80 font-medium">
                        Configurar
                      </button>
                      <button onClick={() => { openEditModal(agente); setTimeout(() => setEditTab('test'), 50) }} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">
                        <MessageCircle className="h-4 w-4 inline mr-1" />Testar
                      </button>
                    </div>
                    <button onClick={() => { setEditingAgent(agente); setShowDeleteModal(true) }} className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 font-medium">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="col-span-full text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              Nenhum agente encontrado
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={closeCreateModal} title="Novo Agente" wide>
        {agentFormFields}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeCreateModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending} className={btnPrimary}>
            {createMutation.isPending ? 'Criando...' : 'Criar Agente'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal with Tabs */}
      <Modal open={showEditModal} onClose={closeEditModal} title={`Configurar: ${editingAgent?.nome || ''}`} wide>
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 -mt-2">
          <button onClick={() => setEditTab('config')} className={tabClass('config')}>Config</button>
          <button onClick={() => setEditTab('tools')} className={tabClass('tools')}>Tools ({selectedToolIds.length})</button>
          <button onClick={() => setEditTab('transfers')} className={tabClass('transfers')}>Transferencias</button>
          <button onClick={() => setEditTab('prompts')} className={tabClass('prompts')}>Prompts</button>
          <button onClick={() => setEditTab('test')} className={tabClass('test')}>Testar</button>
        </div>

        {editTab === 'config' && (
          <>
            {agentFormFields}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeEditModal} className={btnSecondary}>Cancelar</button>
              <button onClick={handleUpdate} disabled={updateMutation.isPending} className={btnPrimary}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alteracoes'}
              </button>
            </div>
          </>
        )}

        {editTab === 'tools' && toolsTabContent}
        {editTab === 'transfers' && transfersTabContent}
        {editTab === 'prompts' && promptsTabContent}
        {editTab === 'test' && testTabContent}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setEditingAgent(null) }} title="Desativar Agente">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja desativar o agente <strong className="text-gray-900 dark:text-white">{editingAgent?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            O agente sera desativado e todas as suas API Keys serao revogadas.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setShowDeleteModal(false); setEditingAgent(null) }} className={btnSecondary}>Cancelar</button>
          <button onClick={() => editingAgent && deleteMutation.mutate(editingAgent.id)} disabled={deleteMutation.isPending} className={btnDanger}>
            {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
