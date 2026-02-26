'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { auth } from '@/lib/api'

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [devToken, setDevToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    try {
      const result = await auth.forgotPassword(email)
      setSent(true)
      // In dev mode, backend returns the token directly
      if (result?.token) {
        setDevToken(result.token)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperacao')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Enviado!</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Se o email <strong>{email}</strong> existir em nossa base, voce recebera instrucoes para redefinir sua senha.
            </p>
          </div>

          {devToken && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Modo Desenvolvimento</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">Use este link para resetar a senha:</p>
              <Link
                href={`/reset-password?token=${devToken}`}
                className="text-xs text-primary hover:text-primary/80 underline break-all"
              >
                /reset-password?token={devToken}
              </Link>
            </div>
          )}

          <div className="text-center space-y-3">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar Senha</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Informe seu email e enviaremos instrucoes para redefinir sua senha
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className={`${inputClass} pl-10`}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Instrucoes'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  )
}
