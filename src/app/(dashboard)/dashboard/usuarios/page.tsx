'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, X, Trash2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const roleLabels: Record<string, string> = {
  master: 'Master',
  admin: 'Admin',
  operador: 'Operador',
  viewer: 'Viewer',
}

const roleColors: Record<string, string> = {
  master: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  operador: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const availableRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'operador', label: 'Operador' },
  { value: 'viewer', label: 'Viewer' },
]

const masterRoles = [
  { value: 'master', label: 'Master' },
  ...availableRoles,
]

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

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const selectClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'operador',
    telefone: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', search],
    queryFn: () => api.get(`/api/usuarios?search=${search}`),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/usuarios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário criado com sucesso!')
      closeCreateModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar usuário'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/usuarios/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário atualizado com sucesso!')
      closeEditModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar usuário'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/usuarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário desativado com sucesso!')
      setShowDeleteModal(false)
      setEditingUser(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao desativar usuário'),
  })

  const resetForm = () => {
    setForm({ nome: '', email: '', senha: '', role: 'operador', telefone: '' })
    setShowPassword(false)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const openEditModal = (usuario: any) => {
    setEditingUser(usuario)
    setForm({
      nome: usuario.nome || '',
      email: usuario.email || '',
      senha: '',
      role: usuario.role || 'operador',
      telefone: usuario.telefone || '',
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    resetForm()
  }

  const openDeleteModal = (usuario: any) => {
    setEditingUser(usuario)
    setShowDeleteModal(true)
  }

  const handleCreate = () => {
    if (!form.nome || !form.email || !form.senha) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (form.senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    createMutation.mutate({
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      role: form.role,
      telefone: form.telefone || undefined,
    })
  }

  const handleUpdate = () => {
    if (!editingUser || !form.nome || !form.email) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    const updateData: any = {
      nome: form.nome,
      email: form.email,
      role: form.role,
      telefone: form.telefone || undefined,
    }
    if (form.senha) {
      if (form.senha.length < 8) {
        toast.error('A senha deve ter no mínimo 8 caracteres')
        return
      }
      updateData.senha = form.senha
    }
    updateMutation.mutate({ id: editingUser.id, data: updateData })
  }

  const canManage = currentUser?.role === 'master' || currentUser?.role === 'admin'
  const isMaster = currentUser?.role === 'master'
  const roles = isMaster ? masterRoles : availableRoles

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie os usuários do sistema
          </p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Último Login</th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.users?.length > 0 ? data.users.map((usuario: any) => {
                const isActive = usuario.ativo ?? usuario.is_active
                const canEdit = canManage && (isMaster || usuario.role !== 'master')
                return (
                  <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {usuario.nome?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nome}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[usuario.role] || roleColors.viewer}`}>
                        {roleLabels[usuario.role] || usuario.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {usuario.ultimo_login ? new Date(usuario.ultimo_login).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {canEdit && (
                          <>
                            <button onClick={() => openEditModal(usuario)} className="text-primary hover:text-primary/80">Editar</button>
                            {usuario.id !== currentUser?.id && (
                              <button onClick={() => openDeleteModal(usuario)} className="text-red-600 hover:text-red-500 dark:text-red-400">
                                <Trash2 className="h-4 w-4 inline" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={closeCreateModal} title="Novo Usuário">
        <FormField label="Nome" required>
          <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Nome completo" />
        </FormField>
        <FormField label="Email" required>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@exemplo.com" />
        </FormField>
        <FormField label="Senha" required>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputClass + ' pr-10'} placeholder="Mínimo 8 caracteres" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
        <FormField label="Role" required>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectClass}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Telefone">
          <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputClass} placeholder="(11) 99999-9999" />
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeCreateModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending} className={btnPrimary}>
            {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={closeEditModal} title="Editar Usuário">
        <FormField label="Nome" required>
          <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Email" required>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Nova Senha (deixe vazio para manter)">
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputClass + ' pr-10'} placeholder="Mínimo 8 caracteres" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
        <FormField label="Role" required>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectClass}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Telefone">
          <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputClass} />
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeEditModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleUpdate} disabled={updateMutation.isPending} className={btnPrimary}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setEditingUser(null) }} title="Desativar Usuário">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja desativar o usuário <strong className="text-gray-900 dark:text-white">{editingUser?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            O usuário não poderá mais acessar o sistema, mas seus dados serão mantidos.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setShowDeleteModal(false); setEditingUser(null) }} className={btnSecondary}>Cancelar</button>
          <button onClick={() => editingUser && deleteMutation.mutate(editingUser.id)} disabled={deleteMutation.isPending} className={btnDanger}>
            {deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
