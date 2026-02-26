'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, Edit, Power, X, Layers, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"

interface ItemForm {
  slug: string
  nome: string
  descricao: string
  tipo_cobranca: 'por_faixa' | 'preco_fixo'
  preco_fixo: string
}

interface FaixaForm {
  nome: string
  limite_diario: string
  preco_mensal: string
}

const defaultItemForm: ItemForm = {
  slug: '',
  nome: '',
  descricao: '',
  tipo_cobranca: 'por_faixa',
  preco_fixo: '0',
}

const defaultFaixaForm: FaixaForm = {
  nome: '',
  limite_diario: '',
  preco_mensal: '',
}

export default function ItensCobraveisPage() {
  const queryClient = useQueryClient()
  const [showItemModal, setShowItemModal] = useState(false)
  const [showFaixaModal, setShowFaixaModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingFaixaId, setEditingFaixaId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>({ ...defaultItemForm })
  const [faixaForm, setFaixaForm] = useState<FaixaForm>({ ...defaultFaixaForm })

  const { data, isLoading } = useQuery({
    queryKey: ['itens-cobraveis'],
    queryFn: () => api.get('/api/itens-cobraveis?include_faixas=true'),
  })

  const createItemMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/itens-cobraveis', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-cobraveis'] })
      toast.success('Item criado!')
      setShowItemModal(false)
      setItemForm({ ...defaultItemForm })
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar item'),
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/api/itens-cobraveis/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-cobraveis'] })
      toast.success('Item atualizado!')
      setShowItemModal(false)
      setEditingItemId(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar item'),
  })

  const createFaixaMutation = useMutation({
    mutationFn: ({ itemId, ...data }: any) => api.post(`/api/itens-cobraveis/${itemId}/faixas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-cobraveis'] })
      toast.success('Faixa criada!')
      setShowFaixaModal(false)
      setFaixaForm({ ...defaultFaixaForm })
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar faixa'),
  })

  const updateFaixaMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/api/itens-cobraveis/faixas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-cobraveis'] })
      toast.success('Faixa atualizada!')
      setShowFaixaModal(false)
      setEditingFaixaId(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar faixa'),
  })

  const openCreateItem = () => {
    setItemForm({ ...defaultItemForm })
    setEditingItemId(null)
    setShowItemModal(true)
  }

  const openEditItem = (item: any) => {
    setItemForm({
      slug: item.slug || '',
      nome: item.nome || '',
      descricao: item.descricao || '',
      tipo_cobranca: item.tipo_cobranca || 'por_faixa',
      preco_fixo: String(item.preco_fixo ?? 0),
    })
    setEditingItemId(item.id)
    setShowItemModal(true)
  }

  const openCreateFaixa = (itemId: string) => {
    setFaixaForm({ ...defaultFaixaForm })
    setSelectedItemId(itemId)
    setEditingFaixaId(null)
    setShowFaixaModal(true)
  }

  const openEditFaixa = (faixa: any, itemId: string) => {
    setFaixaForm({
      nome: faixa.nome || '',
      limite_diario: String(faixa.limite_diario ?? ''),
      preco_mensal: String(faixa.preco_mensal ?? ''),
    })
    setEditingFaixaId(faixa.id)
    setSelectedItemId(itemId)
    setShowFaixaModal(true)
  }

  const handleSubmitItem = () => {
    if (!itemForm.nome.trim()) {
      toast.error('Nome e obrigatorio')
      return
    }
    if (editingItemId) {
      updateItemMutation.mutate({
        id: editingItemId,
        nome: itemForm.nome,
        descricao: itemForm.descricao || undefined,
        preco_fixo: itemForm.tipo_cobranca === 'preco_fixo' ? parseFloat(itemForm.preco_fixo) || 0 : undefined,
      })
    } else {
      if (!itemForm.slug.trim()) {
        toast.error('Slug e obrigatorio')
        return
      }
      createItemMutation.mutate({
        slug: itemForm.slug,
        nome: itemForm.nome,
        descricao: itemForm.descricao || undefined,
        tipo_cobranca: itemForm.tipo_cobranca,
        preco_fixo: itemForm.tipo_cobranca === 'preco_fixo' ? parseFloat(itemForm.preco_fixo) || 0 : undefined,
      })
    }
  }

  const handleSubmitFaixa = () => {
    if (!faixaForm.nome.trim() || !faixaForm.limite_diario || !faixaForm.preco_mensal) {
      toast.error('Preencha todos os campos')
      return
    }
    const payload = {
      nome: faixaForm.nome,
      limite_diario: parseInt(faixaForm.limite_diario) || 1,
      preco_mensal: parseFloat(faixaForm.preco_mensal) || 0,
    }
    if (editingFaixaId) {
      updateFaixaMutation.mutate({ id: editingFaixaId, ...payload })
    } else {
      createFaixaMutation.mutate({ itemId: selectedItemId, ...payload })
    }
  }

  const toggleItemAtivo = (item: any) => {
    updateItemMutation.mutate({ id: item.id, ativo: !item.ativo })
  }

  const toggleFaixaAtivo = (faixa: any) => {
    updateFaixaMutation.mutate({ id: faixa.id, ativo: !faixa.ativo })
  }

  const itens = data?.data || data || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Itens Cobraveis</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie itens adicionais de cobranca para assinaturas
          </p>
        </div>
        <button onClick={openCreateItem} className={btnPrimary}>
          <Plus className="h-4 w-4" />
          Novo Item
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : Array.isArray(itens) && itens.length > 0 ? (
        <div className="space-y-4">
          {itens.map((item: any) => {
            const isExpanded = expandedItem === item.id
            return (
              <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${!item.ativo ? 'opacity-60' : ''}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        item.tipo_cobranca === 'por_faixa'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        {item.tipo_cobranca === 'por_faixa'
                          ? <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          : <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.nome}</h3>
                          <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{item.slug}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            item.tipo_cobranca === 'por_faixa'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {item.tipo_cobranca === 'por_faixa' ? 'Por Faixa' : 'Preco Fixo'}
                          </span>
                          {item.tipo_cobranca === 'preco_fixo' && (
                            <span>R$ {Number(item.preco_fixo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/unidade</span>
                          )}
                          <span>{item.total_assinaturas || 0} assinatura(s)</span>
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {item.tipo_cobranca === 'por_faixa' && (
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => openEditItem(item)} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleItemAtivo(item)}
                      disabled={updateItemMutation.isPending}
                      className={`text-sm flex items-center gap-1 ${item.ativo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-green-600 hover:text-green-800 dark:text-green-400'}`}
                    >
                      <Power className="h-3 w-3" />
                      {item.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    {item.tipo_cobranca === 'por_faixa' && (
                      <button onClick={() => openCreateFaixa(item.id)} className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        Nova Faixa
                      </button>
                    )}
                  </div>
                </div>

                {/* Faixas (expanded) */}
                {isExpanded && item.faixas && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Faixas de Preco</h4>
                    {item.faixas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 dark:text-gray-400">
                              <th className="text-left pb-2">Nome</th>
                              <th className="text-right pb-2">Limite Diario</th>
                              <th className="text-right pb-2">Preco Mensal</th>
                              <th className="text-center pb-2">Status</th>
                              <th className="text-right pb-2">Acoes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {item.faixas.map((faixa: any) => (
                              <tr key={faixa.id} className={!faixa.ativo ? 'opacity-50' : ''}>
                                <td className="py-2 text-gray-900 dark:text-white font-medium">{faixa.nome}</td>
                                <td className="py-2 text-right text-gray-600 dark:text-gray-400">{faixa.limite_diario}/dia</td>
                                <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">
                                  R$ {Number(faixa.preco_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                    faixa.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {faixa.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="py-2 text-right space-x-2">
                                  <button onClick={() => openEditFaixa(faixa, item.id)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => toggleFaixaAtivo(faixa)}
                                    className={`text-xs ${faixa.ativo ? 'text-red-600 hover:text-red-800 dark:text-red-400' : 'text-green-600 hover:text-green-800 dark:text-green-400'}`}
                                  >
                                    {faixa.ativo ? 'Desativar' : 'Ativar'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma faixa cadastrada. Adicione faixas de preco.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item cobravel cadastrado</p>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowItemModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItemId ? 'Editar Item' : 'Novo Item Cobravel'}
              </h2>
              <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {!editingItemId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug <span className="text-red-500">*</span></label>
                  <input type="text" value={itemForm.slug} onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={inputClass} placeholder="ex: numero_whatsapp" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Identificador unico (letras minusculas, numeros e _)</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={itemForm.nome} onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })} className={inputClass} placeholder="Ex: Numero WhatsApp Adicional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao</label>
                <textarea value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} className={inputClass} rows={2} />
              </div>
              {!editingItemId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Cobranca <span className="text-red-500">*</span></label>
                  <select value={itemForm.tipo_cobranca} onChange={(e) => setItemForm({ ...itemForm, tipo_cobranca: e.target.value as any })} className={inputClass}>
                    <option value="por_faixa">Por Faixa (limites diarios com precos diferentes)</option>
                    <option value="preco_fixo">Preco Fixo (valor por unidade)</option>
                  </select>
                </div>
              )}
              {itemForm.tipo_cobranca === 'preco_fixo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preco Fixo (R$)</label>
                  <input type="number" step="0.01" min="0" value={itemForm.preco_fixo} onChange={(e) => setItemForm({ ...itemForm, preco_fixo: e.target.value })} className={inputClass} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowItemModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSubmitItem} disabled={createItemMutation.isPending || updateItemMutation.isPending} className={btnPrimary}>
                {(createItemMutation.isPending || updateItemMutation.isPending) ? 'Salvando...' : editingItemId ? 'Salvar' : 'Criar Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faixa Modal */}
      {showFaixaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowFaixaModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingFaixaId ? 'Editar Faixa' : 'Nova Faixa de Preco'}
              </h2>
              <button onClick={() => setShowFaixaModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={faixaForm.nome} onChange={(e) => setFaixaForm({ ...faixaForm, nome: e.target.value })} className={inputClass} placeholder="Ex: Basico, Intermediario, Premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite Diario <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={faixaForm.limite_diario} onChange={(e) => setFaixaForm({ ...faixaForm, limite_diario: e.target.value })} className={inputClass} placeholder="Ex: 100" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quantidade maxima de uso por dia</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preco Mensal (R$) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" value={faixaForm.preco_mensal} onChange={(e) => setFaixaForm({ ...faixaForm, preco_mensal: e.target.value })} className={inputClass} placeholder="Ex: 49.90" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowFaixaModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={handleSubmitFaixa} disabled={createFaixaMutation.isPending || updateFaixaMutation.isPending} className={btnPrimary}>
                {(createFaixaMutation.isPending || updateFaixaMutation.isPending) ? 'Salvando...' : editingFaixaId ? 'Salvar' : 'Criar Faixa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
