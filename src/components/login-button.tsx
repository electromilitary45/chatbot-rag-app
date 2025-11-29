'use client'

import { signIn, signOut } from 'next-auth/react'
import { Session } from 'next-auth'

interface LoginButtonProps {
  session: Session | null
}

export default function LoginButton({ session }: LoginButtonProps) {
  return (
    <button
      onClick={() => session ? signOut() : signIn('google')}
      className="w-full py-2 px-4 rounded-lg font-semibold transition-colors"
      style={{
        backgroundColor: session ? '#ef4444' : '#4f46e5',
        color: 'white',
      }}
    >
      {session ? 'Cerrar sesión' : 'Iniciar sesión con Google'}
    </button>
  )
}
