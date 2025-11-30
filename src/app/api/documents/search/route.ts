import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { chatId, query, limit = 3 } = await request.json()

    if (!chatId || !query) {
      return NextResponse.json(
        { error: 'chatId y query requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el chat pertenece al usuario
    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', session.user.id)
      .single()

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    // Obtener documentos del chat
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('chat_id', chatId)

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        context: '',
        count: 0,
      })
    }

    const documentIds = documents.map((d) => d.id)

    // Obtener embeddings del chat
    const { data: embeddings, error: embError } = await supabase
      .from('embeddings')
      .select('id, content, metadata')
      .in('document_id', documentIds)

    if (embError) {
      console.error('Error fetching embeddings:', embError)
      return NextResponse.json(
        { error: 'Error al buscar documentos' },
        { status: 500 }
      )
    }

    // Calcular similitud simple basada en palabras coincidentes
    const queryWords = query.toLowerCase().split(/\s+/)
    const results = embeddings
      ?.map((emb) => {
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
      .slice(0, limit)

    // Formatear resultados para RAG
    const ragContext = results
      .map((r) => `[Documento: ${r.metadata?.filename || 'sin nombre'}]\n${r.content}`)
      .join('\n\n---\n\n')

    return NextResponse.json({
      success: true,
      context: ragContext,
      count: results.length,
    })
  } catch (error) {
    console.error('Error in POST /api/documents/search:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
