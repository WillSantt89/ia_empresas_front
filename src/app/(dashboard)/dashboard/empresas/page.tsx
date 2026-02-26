'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, Bot, Plus, Search, Edit, Power, Eye, X, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

interface Empresa {
  id: string
  nome: string
  slug: string
  email: string | null
  telefone: string | null
  documento: string | null
  tipo: string
  plano_id: string | null
  plano_nome: string | null
  ativo: boolean
  criado_em: string
  max_agentes: number
  max_usuarios: number
  max_mensagens_mes: number
  max_tokens_mes: number
  usuarios_ativos: string
  agentes_ativos: string
}

interface CreateEmpresaData {
  nome: string
  email: string
  telefone: string
  documento: string
  tipo: string
  user: {
    nome: string
    email: string
    senha: string
    telefone: string
  }
  limits: {
    max_agentes: number
    max_usuarios: number
    max_mensagens_mes: number
    max_tokens_mes: number
  }
}

const tipoLabels: Record<string, string> = {
  plataforma: 'Plataforma',
  parceiro: 'Parceiro',
  cliente: 'Cliente',
}

const tipoColors: Record<string, string> = {
  plataforma: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  parceiro: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cliente: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const initialFormData: CreateEmpresaData = {
  nome: '',
  email: '',
  telefone: '',
  documento: '',
  tipo: 'cliente',
  user: { nome: '', email: '', senha: '', telefone: '' },
  limits: { max_agentes: 5, max_usuarios: 10, max_mensagens_mes: 10000, max_tokens_mes: 1000000 },
}

export default function EmpresasPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [formData, setFormData] = useState<CreateEmpresaData>(initialFormData)
  const [editData, setEditData] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [resetTarget, setResetTarget] = useState<{ empresaId: string; userId: string; userName: string; userEmail: string } | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  // Master: list all empresas
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['empresas', search, filterTipo],
    queryFn: () => api.get(`/api/empresas?search=${search}&tipo=${filterTipo}`),
    enabled: user?.role === 'master',
  })

  // Non-master: own empresa info
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['empresa', 'me'],
    queryFn: () => api.get('/api/empresas/me'),
    enabled: user?.role !== 'master',
  })

  // Create empresa
  const createMutation = useMutation({
    mutationFn: (data: CreateEmpresaData) => api.post('/api/empresas', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setShowModal(false)
      setFormData(initialFormData)
      toast.success(`Empresa criada! Login: ${result.user.email}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar empresa')
    },
  })

  // Update empresa
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/api/empresas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setShowEditModal(false)
      toast.success('Empresa atualizada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar')
    },
  })

  // Toggle ativo
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/empresas/${id}/toggle`),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      toast.success(result.message)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro')
    },
  })

  // Reset password
  const resetSenhaMutation = useMutation({
    mutationFn: ({ empresaId, userId, nova_senha }: { empresaId: string; userId: string; nova_senha: string }) =>
      api.put(`/api/empresas/${empresaId}/usuarios/${userId}/reset-senha`, { nova_senha }),
    onSuccess: (result) => {
      setShowResetModal(false)
      setResetTarget(null)
      setNovaSenha('')
      toast.success(result.message || 'Senha resetada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao resetar senha')
    },
  })

  const openResetSenha = (empresaId: string, usuario: any) => {
    setResetTarget({
      empresaId,
      userId: usuario.id,
      userName: usuario.nome,
      userEmail: usuario.email,
    })
    setNovaSenha('')
    setShowResetModal(true)
  }

  const handleResetSenha = (e: React.FormEvent) => {
    e.preventDefault()
    if (resetTarget) {
      resetSenhaMutation.mutate({
        empresaId: resetTarget.empresaId,
        userId: resetTarget.userId,
        nova_senha: novaSenha,
      })
    }
  }

  // Get empresa details
  const loadDetails = async (id: string) => {
    try {
      const data = await api.get(`/api/empresas/${id}`)
      setDetailData(data)
      setShowDetailModal(true)
    } catch {
      toast.error('Erro ao carregar detalhes')
    }
  }

  // Open edit modal
  const openEdit = (empresa: Empresa) => {
    setEditData({
      id: empresa.id,
      nome: empresa.nome,
      email: empresa.email || '',
      telefone: empresa.telefone || '',
      documento: empresa.documento || '',
      tipo: empresa.tipo,
      limits: {
        max_agentes: empresa.max_agentes || 5,
        max_usuarios: empresa.max_usuarios || 10,
        max_mensagens_mes: empresa.max_mensagens_mes || 10000,
        max_tokens_mes: Number(empresa.max_tokens_mes) || 1000000,
      },
    })
    setShowEditModal(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(editData)
  }

  // Non-master view: show own company info
  if (user?.role !== 'master') {
    const empresa = meData?.empresa
    const limits = meData?.limits
    const usage = meData?.usage

    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresa</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Informações da sua empresa</p>
        </div>
        {meLoading ? (
          <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{empresa?.nome}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{empresa?.email || empresa?.slug}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Usuarios" value={`${usage?.usuarios_ativos || 0} / ${limits?.max_usuarios || 0}`} color="blue" />
              <StatCard icon={Bot} label="Agentes" value={`${usage?.agentes_ativos || 0} / ${limits?.max_agentes || 0}`} color="green" />
              <StatCard icon={Building2} label="Mensagens/Mes" value={`${(usage?.mensagens_processadas || 0).toLocaleString('pt-BR')} / ${(limits?.max_mensagens_mes || 0).toLocaleString('pt-BR')}`} color="purple" />
              <StatCard icon={Building2} label="Tokens/Mes" value={`${(usage?.tokens_usados || 0).toLocaleString('pt-BR')} / ${(limits?.max_tokens_mes || 0).toLocaleString('pt-BR')}`} color="orange" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Master view: full management
  const empresas: Empresa[] = listData?.empresas || []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie as empresas da plataforma
          </p>
        </div>
        <button
          onClick={() => { setFormData(initialFormData); setShowModal(true) }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todos os tipos</option>
          <option value="plataforma">Plataforma</option>
          <option value="parceiro">Parceiro</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {/* Table */}
      {listLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{empresa.nome}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{empresa.email || empresa.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tipoColors[empresa.tipo] || tipoColors.cliente}`}>
                      {tipoLabels[empresa.tipo] || empresa.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {empresa.plano_nome || 'Sem plano'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>{empresa.usuarios_ativos}/{empresa.max_usuarios || '-'} users</div>
                    <div>{empresa.agentes_ativos}/{empresa.max_agentes || '-'} agentes</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${empresa.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {empresa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => loadDetails(empresa.id)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" title="Detalhes">
                      <Eye className="h-4 w-4 inline" />
                    </button>
                    <button onClick={() => openEdit(empresa)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Editar">
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    {empresa.tipo !== 'plataforma' && (
                      <button
                        onClick={() => {
                          if (confirm(`${empresa.ativo ? 'Desativar' : 'Ativar'} ${empresa.nome}?`)) {
                            toggleMutation.mutate(empresa.id)
                          }
                        }}
                        className={empresa.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={empresa.ativo ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="h-4 w-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <Modal title="Nova Empresa" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-6">
            <Section title="Dados da Empresa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome da Empresa *" value={formData.nome} onChange={(v) => setFormData({ ...formData, nome: v })} required />
                <Input label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                <Input label="Telefone" value={formData.telefone} onChange={(v) => setFormData({ ...formData, telefone: v })} />
                <Input label="CNPJ/CPF" value={formData.documento} onChange={(v) => setFormData({ ...formData, documento: v })} />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="cliente">Cliente</option>
                  <option value="parceiro">Parceiro (acesso Master)</option>
                </select>
              </div>
            </Section>

            <Section title="Usuario Administrador">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome *" value={formData.user.nome} onChange={(v) => setFormData({ ...formData, user: { ...formData.user, nome: v } })} required />
                <Input label="Email *" type="email" value={formData.user.email} onChange={(v) => setFormData({ ...formData, user: { ...formData.user, email: v } })} required />
                <Input label="Senha *" type="password" value={formData.user.senha} onChange={(v) => setFormData({ ...formData, user: { ...formData.user, senha: v } })} required minLength={8} />
                <Input label="Telefone" value={formData.user.telefone} onChange={(v) => setFormData({ ...formData, user: { ...formData.user, telefone: v } })} />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.tipo === 'parceiro'
                  ? 'O usuario sera criado com perfil MASTER (pode gerenciar sub-empresas)'
                  : 'O usuario sera criado com perfil ADMIN (gerencia apenas sua empresa)'}
              </p>
            </Section>

            <Section title="Limites">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input label="Max Agentes" type="number" value={String(formData.limits.max_agentes)} onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, max_agentes: parseInt(v) || 0 } })} />
                <Input label="Max Usuarios" type="number" value={String(formData.limits.max_usuarios)} onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, max_usuarios: parseInt(v) || 0 } })} />
                <Input label="Max Msgs/Mes" type="number" value={String(formData.limits.max_mensagens_mes)} onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, max_mensagens_mes: parseInt(v) || 0 } })} />
                <Input label="Max Tokens/Mes" type="number" value={String(formData.limits.max_tokens_mes)} onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, max_tokens_mes: parseInt(v) || 0 } })} />
              </div>
            </Section>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">
                {createMutation.isPending ? 'Criando...' : 'Criar Empresa'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editData && (
        <Modal title={`Editar: ${editData.nome}`} onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEdit} className="space-y-6">
            <Section title="Dados da Empresa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome" value={editData.nome} onChange={(v) => setEditData({ ...editData, nome: v })} />
                <Input label="Email" type="email" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} />
                <Input label="Telefone" value={editData.telefone} onChange={(v) => setEditData({ ...editData, telefone: v })} />
                <Input label="Documento" value={editData.documento} onChange={(v) => setEditData({ ...editData, documento: v })} />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={editData.tipo}
                  onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="cliente">Cliente</option>
                  <option value="parceiro">Parceiro</option>
                  <option value="plataforma">Plataforma</option>
                </select>
              </div>
            </Section>

            <Section title="Limites">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input label="Max Agentes" type="number" value={String(editData.limits.max_agentes)} onChange={(v) => setEditData({ ...editData, limits: { ...editData.limits, max_agentes: parseInt(v) || 0 } })} />
                <Input label="Max Usuarios" type="number" value={String(editData.limits.max_usuarios)} onChange={(v) => setEditData({ ...editData, limits: { ...editData.limits, max_usuarios: parseInt(v) || 0 } })} />
                <Input label="Max Msgs/Mes" type="number" value={String(editData.limits.max_mensagens_mes)} onChange={(v) => setEditData({ ...editData, limits: { ...editData.limits, max_mensagens_mes: parseInt(v) || 0 } })} />
                <Input label="Max Tokens/Mes" type="number" value={String(editData.limits.max_tokens_mes)} onChange={(v) => setEditData({ ...editData, limits: { ...editData.limits, max_tokens_mes: parseInt(v) || 0 } })} />
              </div>
            </Section>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                Cancelar
              </button>
              <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET SENHA MODAL */}
      {showResetModal && resetTarget && (
        <Modal title="Resetar Senha" onClose={() => { setShowResetModal(false); setResetTarget(null) }}>
          <form onSubmit={handleResetSenha} className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-4">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Voce esta resetando a senha do usuario:
              </p>
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mt-1">
                {resetTarget.userName} ({resetTarget.userEmail})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={8}
                placeholder="Minimo 8 caracteres"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setShowResetModal(false); setResetTarget(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetSenhaMutation.isPending || novaSenha.length < 8}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {resetSenhaMutation.isPending ? 'Resetando...' : 'Resetar Senha'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && detailData && (
        <Modal title={`Detalhes: ${detailData.empresa?.nome}`} onClose={() => setShowDetailModal(false)} wide>
          <div className="space-y-6">
            <Section title="Informacoes">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="Nome" value={detailData.empresa?.nome} />
                <Info label="Slug" value={detailData.empresa?.slug} />
                <Info label="Email" value={detailData.empresa?.email} />
                <Info label="Telefone" value={detailData.empresa?.telefone} />
                <Info label="Documento" value={detailData.empresa?.documento} />
                <Info label="Tipo" value={tipoLabels[detailData.empresa?.tipo] || detailData.empresa?.tipo} />
                <Info label="Plano" value={detailData.empresa?.plano_nome || 'Sem plano'} />
                <Info label="Status" value={detailData.empresa?.ativo ? 'Ativo' : 'Inativo'} />
                <Info label="Criado em" value={detailData.empresa?.criado_em ? new Date(detailData.empresa.criado_em).toLocaleDateString('pt-BR') : '-'} />
              </div>
            </Section>

            <Section title="Limites e Uso">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <UsageCard label="Usuarios" used={detailData.usage?.usuarios_ativos || 0} max={detailData.limits?.max_usuarios || 0} />
                <UsageCard label="Agentes" used={detailData.usage?.agentes_ativos || 0} max={detailData.limits?.max_agentes || 0} />
                <UsageCard label="Mensagens" used={detailData.usage?.mensagens_processadas || 0} max={detailData.limits?.max_mensagens_mes || 0} />
                <UsageCard label="Tokens" used={detailData.usage?.tokens_usados || 0} max={detailData.limits?.max_tokens_mes || 0} />
              </div>
            </Section>

            <Section title={`Usuarios (${detailData.usuarios?.length || 0})`}>
              {detailData.usuarios?.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detailData.usuarios.map((u: any) => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'master' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : u.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                          {u.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${u.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => openResetSenha(detailData.empresa?.id, u)}
                          className="ml-1 p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Resetar senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuario</p>
              )}
            </Section>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Reusable components

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false, minLength, ...props }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="ml-2 text-gray-900 dark:text-white">{value || '-'}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`rounded-md p-3 ${colors[color]}`}><Icon className="h-6 w-6" /></div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function UsageCard({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{Number(used).toLocaleString('pt-BR')} / {Number(max).toLocaleString('pt-BR')}</p>
      <div className="mt-1 h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
