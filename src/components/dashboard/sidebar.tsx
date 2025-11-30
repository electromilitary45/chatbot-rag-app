'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Chat {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface SidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChats = async () => {
      if (!user.id) return
      try {
        const response = await fetch(`/api/chats?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setChats(data)
        }
      } catch (error) {
        console.error('Error loading chats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchChats()
  }, [user.id])

  const handleNewChat = () => {
    router.push('/dashboard/chat/new')
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="text-xl font-bold">Chatbot RAG</span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span>
          Nuevo Chat
        </button>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Historial
        </h3>
        <nav className="space-y-2">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : chats.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No hay chats aún</p>
          ) : (
            chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/dashboard/chat/${chat.id}`}
                className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors truncate"
              >
                {chat.title}
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || 'Usuario'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name || 'Usuario'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
