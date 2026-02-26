'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Plus, Search, X, Trash2, TestTube, Loader2, Wifi, WifiOff } from 'lucide-react'
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

interface NumberForm {
  nome_exibicao: string
  phone_number_id: string
  waba_id: string
  token_graph_api: string
  numero_formatado: string
}

const defaultForm: NumberForm = {
  nome_exibicao: '',
  phone_number_id: '',
  waba_id: '',
  token_graph_api: '',
  numero_formatado: '',
}

export default function WhatsAppNumbersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<any>(null)
  const [form, setForm] = useState<NumberForm>({ ...defaultForm })
  const [showToken, setShowToken] = useState(false)

  const canManage = user?.role === 'master' || user?.role === 'admin'

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => api.get('/api/whatsapp-numbers'),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/whatsapp-numbers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast.success('Numero WhatsApp cadastrado!')
      setShowCreateModal(false)
      setForm({ ...defaultForm })
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao cadastrar numero'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/whatsapp-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] })
      toast.success('Numero desativado!')
      setShowDeleteModal(false)
      setSelectedNumber(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao desativar numero'),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/whatsapp-numbers/${id}/testar`, {}),
    onSuccess: (data: any) => {
      const result = data?.data || data
      if (result?.status === 'ok') {
        toast.success(`Conexao OK! Status: ${result.number_status}`)
      } else {
        toast.error(result?.message || 'Erro na conexao')
      }
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao testar'),
  })

  const handleCreate = () => {
    if (!form.phone_number_id || !form.token_graph_api) {
      toast.error('Phone Number ID e Token sao obrigatorios')
      return
    }
    createMutation.mutate({
      nome_exibicao: form.nome_exibicao || `WhatsApp ${form.phone_number_id}`,
      phone_number_id: form.phone_number_id,
      waba_id: form.waba_id || undefined,
      token_graph_api: form.token_graph_api,
      numero_formatado: form.numero_formatado || undefined,
    })
  }

  const numbers = data?.data || []
  const meta = data?.meta || {}

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Numbers</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie seus numeros WhatsApp conectados
          </p>
        </div>
        {canManage && (
          <button onClick={() => { setForm({ ...defaultForm }); setShowCreateModal(true) }} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Novo Numero
          </button>
        )}
      </div>

      {/* Stats */}
      {meta.limite_contratado > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Numeros cadastrados</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{numbers.length} / {meta.limite_contratado}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Disponiveis</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{meta.numeros_disponiveis || 0}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : numbers.length > 0 ? (
        <div className="space-y-4">
          {numbers.map((num: any) => (
            <div key={num.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${num.ativo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {num.ativo ? <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" /> : <WifiOff className="h-6 w-6 text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{num.nome_exibicao}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      {num.numero_formatado && <span>{num.numero_formatado}</span>}
                      <span className="font-mono text-xs">ID: {num.phone_number_id}</span>
                      {num.inbox_nome && <span>Inbox: {num.inbox_nome}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>{num.total_conversas || 0} conversas</p>
                    <p>{num.conversas_ativas || 0} ativas</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${num.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {num.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {canManage && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => testMutation.mutate(num.id)}
                    disabled={testMutation.isPending}
                    className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    {testMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                    Testar Conexao
                  </button>
                  {num.ativo && (
                    <button
                      onClick={() => { setSelectedNumber(num); setShowDeleteModal(true) }}
                      className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Desativar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum numero WhatsApp cadastrado</p>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Numero WhatsApp">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Exibicao</label>
            <input type="text" value={form.nome_exibicao} onChange={(e) => setForm({ ...form, nome_exibicao: e.target.value })} className={inputClass} placeholder="Ex: Atendimento Principal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number ID <span className="text-red-500">*</span></label>
            <input type="text" value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} className={inputClass} placeholder="ID do numero na Meta" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Encontre em Meta Business Suite &gt; WhatsApp &gt; Phone Numbers</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WABA ID</label>
            <input type="text" value={form.waba_id} onChange={(e) => setForm({ ...form, waba_id: e.target.value })} className={inputClass} placeholder="WhatsApp Business Account ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token Graph API <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.token_graph_api}
                onChange={(e) => setForm({ ...form, token_graph_api: e.target.value })}
                className={inputClass}
                placeholder="Token permanente da Meta Graph API"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                {showToken ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numero Formatado</label>
            <input type="text" value={form.numero_formatado} onChange={(e) => setForm({ ...form, numero_formatado: e.target.value })} className={inputClass} placeholder="+55 11 99999-9999" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className={btnSecondary}>Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending} className={btnPrimary}>
            {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedNumber(null) }} title="Desativar Numero">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tem certeza que deseja desativar o numero <strong className="text-gray-900 dark:text-white">{selectedNumber?.nome_exibicao}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setShowDeleteModal(false); setSelectedNumber(null) }} className={btnSecondary}>Cancelar</button>
          <button onClick={() => selectedNumber && deleteMutation.mutate(selectedNumber.id)} disabled={deleteMutation.isPending} className={btnDanger}>
            {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
