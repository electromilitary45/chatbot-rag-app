'use client'

import { FormEvent, useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  chatId: string
}

export default function ChatInput({ chatId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [message])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!message.trim() && files.length === 0) return

    setError(null)
    setLoading(true)
    const userMessage = message.trim()
    setMessage('')
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      // TODO: Implementar subida de archivos a Supabase
      // Por ahora, solo enviamos el mensaje de texto
      
      // Enviar el mensaje a la API que procesará con OpenRouter
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          userMessage: userMessage || `[Adjuntos: ${files.map((f) => f.name).join(', ')}]`,
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
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Archivos adjuntos */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2"
            >
              <span className="text-sm text-indigo-900">📎 {file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-[200px] min-h-[44px] text-gray-900 placeholder-gray-500"
              disabled={loading}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!message.trim() && files.length === 0)}
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
        </div>

        {/* Botón para subir archivos */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.gif"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            📎 Agregar archivo
          </button>
          <p className="text-xs text-gray-500">
            Soportados: PDF, TXT, DOC, Imágenes
          </p>
        </div>

        <p className="text-xs text-gray-500">
          💡 Presiona <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-900">Ctrl + Enter</kbd> para enviar
        </p>
      </form>
    </div>
  )
}

