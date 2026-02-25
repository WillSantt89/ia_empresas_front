'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Recuperar Senha</h2>
      <p className="text-gray-600 mb-6">Em breve...</p>
      <Link href="/login">
        <Button variant="outline">Voltar ao Login</Button>
      </Link>
    </div>
  )
}