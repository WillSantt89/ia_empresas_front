'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Acesso Empresarial
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        O cadastro de novas empresas e feito exclusivamente pela equipe <strong>WSCHAT</strong>.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Entre em contato conosco para contratar um plano e receber seu acesso administrativo.
      </p>
      <div className="space-y-3">
        <Link
          href="/login"
          className="block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ja tenho acesso - Fazer Login
        </Link>
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Falar com a WSCHAT
        </a>
      </div>
    </div>
  )
}
