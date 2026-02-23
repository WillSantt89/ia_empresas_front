import { Metadata } from 'next'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Faça login ou crie sua conta',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2">
          <Brain className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            IA Empresas
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Plataforma Administrativa
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {children}
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© 2024 IA Empresas. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}