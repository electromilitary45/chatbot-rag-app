'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Chat {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatListProps {
  userId: string
}

export default function ChatList({ userId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/chats?userId=${userId}`)
        if (!response.ok) throw new Error('Error al cargar chats')
        const data = await response.json()
        setChats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchChats()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando chats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={async () => {
              try {
                setLoading(true)
                const response = await fetch(`/api/chats?userId=${userId}`)
                if (!response.ok) throw new Error('Error al cargar chats')
                const data = await response.json()
                setChats(data)
                setError(null)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido')
              } finally {
                setLoading(false)
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chats.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No tienes chats</h3>
          <p className="text-gray-600 mb-6">Comienza creando tu primer chat</p>
          <Link
            href="/dashboard/chat/new"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Crear nuevo chat
          </Link>
        </div>
      ) : (
        chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/dashboard/chat/${chat.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {chat.title}
              </h3>
              <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">→</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(chat.updated_at).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
