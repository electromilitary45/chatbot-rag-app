'use client'

import { FormEvent, useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  chatId: string
}

export default function ChatInput({ chatId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [message])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!message.trim()) return

    setError(null)
    setLoading(true)
    const userMessage = message.trim()
    setMessage('')

    try {
      // Enviar el mensaje a la API que procesará con OpenRouter
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          userMessage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      const { userMessage: userMsg, assistantMessage: assistantMsg } = await response.json()

      // Emitir evento para el mensaje del usuario
      window.dispatchEvent(
        new CustomEvent('messageAdded', {
          detail: {
            chatId,
            message: userMsg,
          },
        })
      )

      // Emitir evento para la respuesta del asistente
      window.dispatchEvent(
        new CustomEvent('messageAdded', {
          detail: {
            chatId,
            message: assistantMsg,
          },
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // Restaurar el mensaje en caso de error
      setMessage(userMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as FormEvent<HTMLFormElement>
                handleSubmit(formEvent)
              }
            }}
            placeholder="Escribe tu mensaje... (Ctrl+Enter para enviar)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-[200px] min-h-[44px]"
            disabled={loading}
            rows={1}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 self-end"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar'
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        💡 Presiona <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + Enter</kbd> para enviar
      </p>
    </div>
  )
}
