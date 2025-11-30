'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface ChatMessagesProps {
  initialMessages: Message[]
  chatId: string
}

export default function ChatMessages({ initialMessages, chatId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Función para actualizar mensajes (será llamada desde ChatInput)
  useEffect(() => {
    const handleMessageAdded = (e: Event) => {
      const customEvent = e as CustomEvent<{ chatId: string; message: Message }>
      if (customEvent.detail.chatId === chatId) {
        setMessages((prev) => [...prev, customEvent.detail.message])
      }
    }

    window.addEventListener('messageAdded', handleMessageAdded)

    return () => {
      window.removeEventListener('messageAdded', handleMessageAdded)
    }
  }, [chatId])

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Inicia una conversación
          </h3>
          <p className="text-gray-600">
            Escribe tu primer mensaje para comenzar a chatear
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 animate-fadeIn ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1">
                  🤖
                </div>
              )}

              <div
                className={`max-w-xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-indigo-100'
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white flex-shrink-0 mt-1">
                  👤
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}
