'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, Plus, Search, X, Zap, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto mx-4`}>
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

// Labels amigáveis para os modelos
const modelLabels: Record<string, string> = {
  // Gemini 3 series
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview (mais avançado)',
  'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
  'gemini-3-flash-preview': 'Gemini 3 Flash Preview (rápido + inteligente)',
  // Gemini 2.5 series
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (econômico)',
  // Gemini 2.0 series
  'gemini-2.0-pro-001': 'Gemini 2.0 Pro',
  'gemini-2.0-flash-001': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  // Gemini 1.5 series (legacy)
  'gemini-1.5-pro': 'Gemini 1.5 Pro (legacy)',
  'gemini-1.5-flash': 'Gemini 1.5 Flash (legacy)',
  'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B (legacy)',
}

const providerLabels: Record<string, string> = {
  google: 'Google AI',
  claude: 'Anthropic Claude',
  grok: 'xAI Grok',
}

export default function AgentesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<any>(null)
  const [form, setForm] = useState<AgentForm>({ ...defaultForm })

  const { data, isLoading } = useQuery({
    queryKey: ['agentes', search],
    queryFn: () => api.get(`/api/agentes?search=${search}`),
  })

  // Load providers and models from backend
  const { data: providersData } = useQuery({
    queryKey: ['agentes-providers'],
    queryFn: () => api.get('/api/agentes/providers'),
    staleTime: 60 * 60 * 1000, // 1h - rarely changes
  })

  const providers = providersData?.providers || []
  const currentProvider = providers.find((p: any) => p.id === form.provider)
  const availableModels: string[] = currentProvider?.modelos || []

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
      closeEditModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar agente'),
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
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingAgent(null)
    resetForm()
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
      toast.error('O prompt deve ter no mínimo 10 caracteres')
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

  const canManage = user?.role === 'master' || user?.role === 'admin'

  const agentFormFields = (
    <>
      <FormField label="Nome" required>
        <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex: Atendimento WhatsApp" />
      </FormField>
      <FormField label="Descrição">
        <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Breve descrição do agente" />
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
      <FormField label="Prompt do Sistema" required hint="Instruções que definem o comportamento do agente. Mínimo 10 caracteres.">
        <textarea
          value={form.prompt_ativo}
          onChange={(e) => setForm({ ...form, prompt_ativo: e.target.value })}
          className={textareaClass}
          rows={6}
          placeholder="Você é um assistente de atendimento ao cliente..."
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={`Temperatura: ${form.temperatura}`} hint="0 = preciso, 2 = criativo">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={form.temperatura}
            onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </FormField>
        <FormField label="Max Tokens" hint="100 - 8192">
          <input
            type="number"
            min={100}
            max={8192}
            value={form.max_tokens}
            onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 2048 })}
            className={inputClass}
          />
        </FormField>
      </div>
    </>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agentes IA</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure e gerencie seus agentes de inteligência artificial
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
                  {agente.descricao || 'Sem descrição'}
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
                    <button onClick={() => openEditModal(agente)} className="text-sm text-primary hover:text-primary/80 font-medium">
                      Configurar
                    </button>
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

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={closeEditModal} title="Configurar Agente" wide>
        {agentFormFields}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeEditModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleUpdate} disabled={updateMutation.isPending} className={btnPrimary}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setEditingAgent(null) }} title="Desativar Agente">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja desativar o agente <strong className="text-gray-900 dark:text-white">{editingAgent?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            O agente será desativado e todas as suas API Keys serão revogadas.
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
