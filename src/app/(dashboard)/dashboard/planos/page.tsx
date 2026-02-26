'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, Edit, Power, X, Users, Bot, MessageSquare, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"

interface PlanoForm {
  nome: string
  descricao: string
  preco_base_mensal: string
  max_usuarios: string
  max_tools: string
  max_mensagens_mes: string
  permite_modelo_pro: boolean
}

const defaultForm: PlanoForm = {
  nome: '',
  descricao: '',
  preco_base_mensal: '0',
  max_usuarios: '3',
  max_tools: '10',
  max_mensagens_mes: '5000',
  permite_modelo_pro: false,
}

export default function PlanosPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanoForm>({ ...defaultForm })

  const { data, isLoading } = useQuery({
    queryKey: ['planos'],
    queryFn: () => api.get('/api/planos'),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/planos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] })
      toast.success('Plano criado!')
      closeModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar plano'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/api/planos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos'] })
      toast.success('Plano atualizado!')
      closeModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar plano'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm({ ...defaultForm })
  }

  const openCreate = () => {
    setForm({ ...defaultForm })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (plano: any) => {
    setForm({
      nome: plano.nome || '',
      descricao: plano.descricao || '',
      preco_base_mensal: String(plano.preco_base_mensal ?? 0),
      max_usuarios: String(plano.max_usuarios ?? 3),
      max_tools: String(plano.max_tools ?? 10),
      max_mensagens_mes: String(plano.max_mensagens_mes ?? 5000),
      permite_modelo_pro: plano.permite_modelo_pro ?? false,
    })
    setEditingId(plano.id)
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.nome.trim()) {
      toast.error('Nome e obrigatorio')
      return
    }
    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      preco_base_mensal: parseFloat(form.preco_base_mensal) || 0,
      max_usuarios: parseInt(form.max_usuarios) || 3,
      max_tools: parseInt(form.max_tools) || 10,
      max_mensagens_mes: parseInt(form.max_mensagens_mes) || 5000,
      permite_modelo_pro: form.permite_modelo_pro,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleAtivo = (plano: any) => {
    updateMutation.mutate({ id: plano.id, ativo: !plano.ativo })
  }

  const planos = data?.data || data || []
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie os planos disponiveis para as empresas
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="h-4 w-4" />
          Novo Plano
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : Array.isArray(planos) && planos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {planos.map((plano: any) => (
            <div
              key={plano.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-colors ${
                plano.ativo ? 'border-primary/20 hover:border-primary/40' : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plano.nome}</h3>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    plano.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {plano.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {plano.descricao && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plano.descricao}</p>
                )}

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    R$ {Number(plano.preco_base_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/mes</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Ate {plano.max_usuarios} usuarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Bot className="h-4 w-4 text-gray-400" />
                    <span>Ate {plano.max_tools} tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span>{Number(plano.max_mensagens_mes).toLocaleString('pt-BR')} msgs/mes</span>
                  </div>
                  {plano.permite_modelo_pro && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-4 w-4" />
                      <span>Modelo Pro</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {plano.total_empresas || 0} empresa(s) usando este plano
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => openEdit(plano)} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <Edit className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(plano)}
                    disabled={updateMutation.isPending}
                    className={`text-sm flex items-center gap-1 ${plano.ativo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-green-600 hover:text-green-800 dark:text-green-400'}`}
                  >
                    <Power className="h-3 w-3" />
                    {plano.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum plano cadastrado</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar Plano' : 'Novo Plano'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex: Starter, Pro, Enterprise" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} rows={2} placeholder="Descricao do plano" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preco Base Mensal (R$) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" value={form.preco_base_mensal} onChange={(e) => setForm({ ...form, preco_base_mensal: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Usuarios</label>
                  <input type="number" min="1" value={form.max_usuarios} onChange={(e) => setForm({ ...form, max_usuarios: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Tools</label>
                  <input type="number" min="0" value={form.max_tools} onChange={(e) => setForm({ ...form, max_tools: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Msgs/Mes</label>
                  <input type="number" min="0" value={form.max_mensagens_mes} onChange={(e) => setForm({ ...form, max_mensagens_mes: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="permite_modelo_pro"
                  checked={form.permite_modelo_pro}
                  onChange={(e) => setForm({ ...form, permite_modelo_pro: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                />
                <label htmlFor="permite_modelo_pro" className="text-sm text-gray-700 dark:text-gray-300">
                  Permite uso de Modelo Pro (GPT-4, Claude, etc)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSubmit} disabled={isPending} className={btnPrimary}>
                {isPending ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
