'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Copy, RotateCw, X, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
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
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  standby: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  rate_limited: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  erro: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  revogado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function ApiKeysPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<any>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Form state
  const [createForm, setCreateForm] = useState({
    agente_id: '',
    nome: '',
    gemini_api_key: '',
  })
  const [rotateKey, setRotateKey] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api/api-keys'),
  })

  // Load agents for the select dropdown
  const { data: agentesData } = useQuery({
    queryKey: ['agentes', ''],
    queryFn: () => api.get('/api/agentes?search='),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/api-keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API Key criada com sucesso!')
      closeCreateModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar API Key'),
  })

  const rotateMutation = useMutation({
    mutationFn: ({ id, gemini_api_key }: { id: string; gemini_api_key: string }) =>
      api.post(`/api/api-keys/${id}/rotate`, { gemini_api_key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API Key rotacionada com sucesso!')
      closeRotateModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao rotacionar API Key'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API Key revogada com sucesso!')
      setShowRevokeModal(false)
      setSelectedKey(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao revogar API Key'),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const openCreateModal = () => {
    setCreateForm({ agente_id: '', nome: '', gemini_api_key: '' })
    setShowApiKey(false)
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateForm({ agente_id: '', nome: '', gemini_api_key: '' })
  }

  const openRotateModal = (key: any) => {
    setSelectedKey(key)
    setRotateKey('')
    setShowApiKey(false)
    setShowRotateModal(true)
  }

  const closeRotateModal = () => {
    setShowRotateModal(false)
    setSelectedKey(null)
    setRotateKey('')
  }

  const handleCreate = () => {
    if (!createForm.agente_id || !createForm.nome || !createForm.gemini_api_key) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (createForm.gemini_api_key.length < 20) {
      toast.error('A chave Gemini deve ter no mínimo 20 caracteres')
      return
    }
    createMutation.mutate({
      agente_id: createForm.agente_id,
      nome: createForm.nome,
      gemini_api_key: createForm.gemini_api_key,
    })
  }

  const handleRotate = () => {
    if (!selectedKey || !rotateKey) {
      toast.error('Informe a nova chave Gemini')
      return
    }
    if (rotateKey.length < 20) {
      toast.error('A chave Gemini deve ter no mínimo 20 caracteres')
      return
    }
    rotateMutation.mutate({ id: selectedKey.id, gemini_api_key: rotateKey })
  }

  const canManage = user?.role === 'master' || user?.role === 'admin'
  const agents = agentesData?.agents || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie as chaves de API dos agentes
          </p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Nova API Key
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome / Agente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Último Uso</th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.keys?.length > 0 ? data.keys.map((key: any) => {
                const status = key.status || (key.ativo || key.is_active ? 'ativa' : 'revogado')
                return (
                  <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {key.nome_exibicao || key.nome || 'API Key'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {key.agente_nome || key.agente?.nome || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || statusColors.ativa}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {key.criado_em ? new Date(key.criado_em).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {key.ultimo_uso ? new Date(key.ultimo_uso).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {status !== 'revogado' && (
                          <>
                            <button
                              onClick={() => openRotateModal(key)}
                              className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                              title="Rotacionar chave"
                            >
                              <RotateCw className="h-4 w-4 inline" />
                            </button>
                            <button
                              onClick={() => { setSelectedKey(key); setShowRevokeModal(true) }}
                              className="text-red-600 hover:text-red-500 dark:text-red-400"
                              title="Revogar chave"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma API Key encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={closeCreateModal} title="Nova API Key">
        <FormField label="Agente" required>
          <select
            value={createForm.agente_id}
            onChange={(e) => setCreateForm({ ...createForm, agente_id: e.target.value })}
            className={selectClass}
          >
            <option value="">Selecione um agente...</option>
            {agents.map((agent: any) => (
              <option key={agent.id} value={agent.id}>{agent.nome}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Nome de Exibição" required hint="Nome para identificar esta chave">
          <input
            type="text"
            value={createForm.nome}
            onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
            className={inputClass}
            placeholder="Ex: Produção - Atendimento"
          />
        </FormField>
        <FormField label="Chave API Gemini" required hint="Chave de API do Google Gemini (mínimo 20 caracteres)">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={createForm.gemini_api_key}
              onChange={(e) => setCreateForm({ ...createForm, gemini_api_key: e.target.value })}
              className={inputClass + ' pr-10'}
              placeholder="AIzaSy..."
            />
            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeCreateModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending} className={btnPrimary}>
            {createMutation.isPending ? 'Criando...' : 'Criar API Key'}
          </button>
        </div>
      </Modal>

      {/* Rotate Modal */}
      <Modal open={showRotateModal} onClose={closeRotateModal} title="Rotacionar API Key">
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Atenção</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              A chave atual será revogada e substituída pela nova. Certifique-se de que a nova chave é válida.
            </p>
          </div>
        </div>
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Chave: <strong className="text-gray-900 dark:text-white">{selectedKey?.nome_exibicao || selectedKey?.nome}</strong>
        </div>
        <FormField label="Nova Chave API Gemini" required>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={rotateKey}
              onChange={(e) => setRotateKey(e.target.value)}
              className={inputClass + ' pr-10'}
              placeholder="AIzaSy..."
            />
            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeRotateModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleRotate} disabled={rotateMutation.isPending} className={btnPrimary}>
            {rotateMutation.isPending ? 'Rotacionando...' : 'Rotacionar'}
          </button>
        </div>
      </Modal>

      {/* Revoke Confirmation */}
      <Modal open={showRevokeModal} onClose={() => { setShowRevokeModal(false); setSelectedKey(null) }} title="Revogar API Key">
        <div className="mb-4">
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">Ação irreversível</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Esta chave será permanentemente revogada e não poderá mais ser utilizada.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revogar a chave <strong className="text-gray-900 dark:text-white">{selectedKey?.nome_exibicao || selectedKey?.nome}</strong>?
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setShowRevokeModal(false); setSelectedKey(null) }} className={btnSecondary}>Cancelar</button>
          <button onClick={() => selectedKey && revokeMutation.mutate(selectedKey.id)} disabled={revokeMutation.isPending} className={btnDanger}>
            {revokeMutation.isPending ? 'Revogando...' : 'Revogar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
