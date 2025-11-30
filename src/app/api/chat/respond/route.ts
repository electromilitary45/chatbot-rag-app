import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateChatResponse } from '@/lib/openrouter'

interface ChatRequestBody {
  chatId: string
  userMessage: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { chatId, userMessage }: ChatRequestBody = await request.json()

    if (!chatId || !userMessage) {
      return NextResponse.json(
        { error: 'chatId y userMessage son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el chat pertenece al usuario
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', session.user.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el historial de mensajes del chat
    const { data: messages = [], error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(20) // Limitar a últimos 20 mensajes para contexto

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Error al obtener historial' },
        { status: 500 }
      )
    }

    // Obtener documentos del usuario para RAG (implementar después)
    // const { data: documents } = await supabase
    //   .from('documents')
    //   .select('id, filename, file_url')
    //   .eq('user_id', session.user.id)

    // Preparar contexto de conversación
    const conversationContext = [
      ...messages,
      { role: 'user' as const, content: userMessage },
    ]

    // Buscar documentos relevantes para RAG
    let ragContext = ''
    try {
      // Obtener documentos del chat directamente
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('chat_id', chatId)

      if (documents && documents.length > 0) {
        const documentIds = documents.map((d) => d.id)

        // Obtener embeddings del chat
        const { data: embeddings } = await supabase
          .from('embeddings')
          .select('id, content, metadata')
          .in('document_id', documentIds)

        if (embeddings && embeddings.length > 0) {
          // Calcular similitud simple basada en palabras coincidentes
          const queryWords = userMessage.toLowerCase().split(/\s+/)
          const results = embeddings
            .map((emb) => {
              const content = emb.content.toLowerCase()
              let score = 0

              // Contar palabras que coinciden
              for (const word of queryWords) {
                if (content.includes(word)) {
                  score += 1
                }
              }

              return {
                id: emb.id,
                content: emb.content,
                score,
                metadata: emb.metadata,
              }
            })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)

          // Formatear resultados para RAG
          ragContext = results
            .map((r) => `[Documento: ${r.metadata?.filename || 'sin nombre'}]\n${r.content}`)
            .join('\n\n---\n\n')
        }
      }
    } catch (ragError) {
      console.warn('RAG search error:', ragError)
      // Continuar sin RAG si hay error
    }

    // Generar respuesta usando OpenRouter o Ollama con contexto RAG
    const assistantResponse = await generateChatResponse({
      messages: conversationContext,
      temperature: 0.7,
      maxTokens: 1000,
      ragContext, // Agregar contexto RAG aquí
    })

    // Guardar el mensaje del usuario
    const { data: userMsg, error: userMsgError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'user',
          content: userMessage,
        },
      ])
      .select()
      .single()

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      return NextResponse.json(
        { error: 'Error al guardar mensaje' },
        { status: 500 }
      )
    }

    // Guardar la respuesta del asistente
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'assistant',
          content: assistantResponse,
        },
      ])
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
      return NextResponse.json(
        { error: 'Error al guardar respuesta' },
        { status: 500 }
      )
    }

    // Actualizar el updated_at del chat
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    })
  } catch (error) {
    console.error('Error in POST /api/chat/respond:', error)
    
    // Manejo específico de errores de OpenRouter
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Error de configuración: API key no válida' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
