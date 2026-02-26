'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wrench, Plus, Search, X, Globe, Lock, Trash2, Play } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

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
const textareaClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-y"
const btnPrimary = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
const btnSecondary = "inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
const btnDanger = "inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

interface ToolForm {
  nome: string
  descricao: string
  descricao_para_llm: string
  url: string
  metodo: string
  parametros_schema_json: string
  headers_json: string
  body_template_json: string
  timeout_ms: number
}

const defaultForm: ToolForm = {
  nome: '',
  descricao: '',
  descricao_para_llm: '',
  url: '',
  metodo: 'GET',
  parametros_schema_json: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
  headers_json: '{}',
  body_template_json: '{}',
  timeout_ms: 5000,
}

export default function FerramentasPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingTool, setEditingTool] = useState<any>(null)
  const [form, setForm] = useState<ToolForm>({ ...defaultForm })
  const [testArgs, setTestArgs] = useState('{}')
  const [testResult, setTestResult] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tools', search],
    queryFn: () => api.get(`/api/tools?search=${search}`),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/tools', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Ferramenta criada com sucesso!')
      closeCreateModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar ferramenta'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/tools/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Ferramenta atualizada com sucesso!')
      closeEditModal()
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar ferramenta'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Ferramenta removida com sucesso!')
      setShowDeleteModal(false)
      setEditingTool(null)
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao remover ferramenta'),
  })

  const testMutation = useMutation({
    mutationFn: ({ id, args }: { id: string; args: any }) => api.post(`/api/tools/${id}/test`, { args }),
    onSuccess: (data) => {
      setTestResult(data)
      toast.success('Teste executado!')
    },
    onError: (err: any) => {
      setTestResult({ error: err.message })
      toast.error(err.message || 'Erro ao testar ferramenta')
    },
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

  const openEditModal = (tool: any) => {
    setEditingTool(tool)
    setForm({
      nome: tool.nome || '',
      descricao: tool.descricao || '',
      descricao_para_llm: tool.descricao_para_llm || '',
      url: tool.url || '',
      metodo: tool.metodo || 'GET',
      parametros_schema_json: tool.parametros_schema_json ? JSON.stringify(tool.parametros_schema_json, null, 2) : '{}',
      headers_json: tool.headers_json ? JSON.stringify(tool.headers_json, null, 2) : '{}',
      body_template_json: tool.body_template_json ? JSON.stringify(tool.body_template_json, null, 2) : '{}',
      timeout_ms: tool.timeout_ms || 5000,
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingTool(null)
    resetForm()
  }

  const openTestModal = (tool: any) => {
    setEditingTool(tool)
    setTestArgs('{}')
    setTestResult(null)
    setShowTestModal(true)
  }

  const parseJsonField = (value: string, fieldName: string): any | null => {
    try {
      return JSON.parse(value)
    } catch {
      toast.error(`JSON inválido no campo ${fieldName}`)
      return null
    }
  }

  const handleCreate = () => {
    if (!form.nome || !form.descricao_para_llm || !form.url || !form.metodo) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    const parametros = parseJsonField(form.parametros_schema_json, 'Parâmetros Schema')
    if (parametros === null) return
    const headers = parseJsonField(form.headers_json, 'Headers')
    if (headers === null) return
    const body = parseJsonField(form.body_template_json, 'Body Template')
    if (body === null) return

    createMutation.mutate({
      nome: form.nome,
      descricao: form.descricao || undefined,
      descricao_para_llm: form.descricao_para_llm,
      url: form.url,
      metodo: form.metodo,
      parametros_schema_json: parametros,
      headers_json: Object.keys(headers).length > 0 ? headers : undefined,
      body_template_json: Object.keys(body).length > 0 ? body : undefined,
      timeout_ms: form.timeout_ms,
    })
  }

  const handleUpdate = () => {
    if (!editingTool || !form.nome || !form.descricao_para_llm || !form.url) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    const parametros = parseJsonField(form.parametros_schema_json, 'Parâmetros Schema')
    if (parametros === null) return
    const headers = parseJsonField(form.headers_json, 'Headers')
    if (headers === null) return
    const body = parseJsonField(form.body_template_json, 'Body Template')
    if (body === null) return

    updateMutation.mutate({
      id: editingTool.id,
      data: {
        nome: form.nome,
        descricao: form.descricao || undefined,
        descricao_para_llm: form.descricao_para_llm,
        url: form.url,
        metodo: form.metodo,
        parametros_schema_json: parametros,
        headers_json: Object.keys(headers).length > 0 ? headers : undefined,
        body_template_json: Object.keys(body).length > 0 ? body : undefined,
        timeout_ms: form.timeout_ms,
      },
    })
  }

  const handleTest = () => {
    if (!editingTool) return
    const args = parseJsonField(testArgs, 'Argumentos')
    if (args === null) return
    testMutation.mutate({ id: editingTool.id, args })
  }

  const canManage = user?.role === 'master' || user?.role === 'admin'

  const ToolFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nome" required>
          <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex: consulta_cep" />
        </FormField>
        <FormField label="Método" required>
          <select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })} className={selectClass}>
            {httpMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="URL" required>
        <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputClass} placeholder="https://api.exemplo.com/endpoint" />
      </FormField>
      <FormField label="Descrição">
        <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Descrição breve da ferramenta" />
      </FormField>
      <FormField label="Descrição para LLM" required hint="Texto que o modelo de IA usa para entender quando e como usar esta ferramenta. Mínimo 10 caracteres.">
        <textarea
          value={form.descricao_para_llm}
          onChange={(e) => setForm({ ...form, descricao_para_llm: e.target.value })}
          className={textareaClass}
          rows={3}
          placeholder="Esta ferramenta consulta o CEP e retorna o endereço completo..."
        />
      </FormField>
      <FormField label="Parâmetros Schema (JSON)" required hint="JSON Schema que define os parâmetros aceitos pela ferramenta">
        <textarea
          value={form.parametros_schema_json}
          onChange={(e) => setForm({ ...form, parametros_schema_json: e.target.value })}
          className={textareaClass}
          rows={5}
        />
      </FormField>
      <FormField label="Headers (JSON)" hint="Headers HTTP adicionais para a requisição">
        <textarea
          value={form.headers_json}
          onChange={(e) => setForm({ ...form, headers_json: e.target.value })}
          className={textareaClass}
          rows={2}
        />
      </FormField>
      <FormField label="Body Template (JSON)" hint="Template do corpo da requisição (para POST/PUT)">
        <textarea
          value={form.body_template_json}
          onChange={(e) => setForm({ ...form, body_template_json: e.target.value })}
          className={textareaClass}
          rows={2}
        />
      </FormField>
      <FormField label="Timeout (ms)" hint="100 - 30000">
        <input
          type="number"
          min={100}
          max={30000}
          value={form.timeout_ms}
          onChange={(e) => setForm({ ...form, timeout_ms: parseInt(e.target.value) || 5000 })}
          className={inputClass}
        />
      </FormField>
    </>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ferramentas</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie as ferramentas e integrações dos agentes
          </p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Nova Ferramenta
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ferramentas..."
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
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.tools?.length > 0 ? data.tools.map((tool: any) => {
            const isGlobal = tool.is_global ?? tool.global
            return (
              <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${methodColors[tool.metodo] || methodColors.GET}`}>
                      {tool.metodo}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {isGlobal ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{tool.nome}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {tool.descricao || tool.descricao_para_llm || 'Sem descrição'}
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                  {tool.url}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  {canManage && !isGlobal && (
                    <button onClick={() => openEditModal(tool)} className="text-sm text-primary hover:text-primary/80 font-medium">Editar</button>
                  )}
                  <button onClick={() => openTestModal(tool)} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
                    <Play className="h-3 w-3" /> Testar
                  </button>
                  {canManage && !isGlobal && (
                    <button onClick={() => { setEditingTool(tool); setShowDeleteModal(true) }} className="text-sm text-red-600 hover:text-red-500 dark:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              Nenhuma ferramenta encontrada
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={closeCreateModal} title="Nova Ferramenta" wide>
        <ToolFormFields />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeCreateModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleCreate} disabled={createMutation.isPending} className={btnPrimary}>
            {createMutation.isPending ? 'Criando...' : 'Criar Ferramenta'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={closeEditModal} title="Editar Ferramenta" wide>
        <ToolFormFields />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeEditModal} className={btnSecondary}>Cancelar</button>
          <button onClick={handleUpdate} disabled={updateMutation.isPending} className={btnPrimary}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </Modal>

      {/* Test Modal */}
      <Modal open={showTestModal} onClose={() => { setShowTestModal(false); setEditingTool(null); setTestResult(null) }} title={`Testar: ${editingTool?.nome || ''}`}>
        <FormField label="Argumentos (JSON)" hint="Parâmetros a serem enviados na requisição de teste">
          <textarea
            value={testArgs}
            onChange={(e) => setTestArgs(e.target.value)}
            className={textareaClass}
            rows={4}
            placeholder='{ "param1": "valor1" }'
          />
        </FormField>
        <div className="flex justify-end mb-4">
          <button onClick={handleTest} disabled={testMutation.isPending} className={btnPrimary}>
            {testMutation.isPending ? 'Executando...' : 'Executar Teste'}
          </button>
        </div>
        {testResult && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resultado</label>
            <pre className="bg-gray-100 dark:bg-gray-900 rounded-md p-3 text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-60 font-mono">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setEditingTool(null) }} title="Remover Ferramenta">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja remover a ferramenta <strong className="text-gray-900 dark:text-white">{editingTool?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            A ferramenta será removida de todos os agentes associados. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setShowDeleteModal(false); setEditingTool(null) }} className={btnSecondary}>Cancelar</button>
          <button onClick={() => editingTool && deleteMutation.mutate(editingTool.id)} disabled={deleteMutation.isPending} className={btnDanger}>
            {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
