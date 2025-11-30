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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const chatId = formData.get('chatId') as string

    if (!file || !chatId) {
      return NextResponse.json(
        { error: 'Archivo y chatId requeridos' },
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

    // Leer el contenido del archivo
    const buffer = await file.arrayBuffer()
    const text = Buffer.from(buffer).toString('utf-8')

    // Generar embeddings simples (por ahora, usamos hash del contenido)
    // En producción, usarías un servicio como Cohere o Sentence Transformers
    const embedding = generateSimpleEmbedding(text)

    // Guardar documento en Supabase
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: session.user.id,
          chat_id: chatId,
          filename: file.name,
          file_url: '', // Placeholder
          file_size: file.size,
          file_type: file.type,
          content: text,
        },
      ])
      .select()
      .single()

    if (docError) {
      console.error('Error saving document:', docError)
      return NextResponse.json(
        { error: 'Error al guardar documento' },
        { status: 500 }
      )
    }

    // Guardar embeddings
    const { error: embError } = await supabase
      .from('embeddings')
      .insert([
        {
          document_id: document.id,
          content: text,
          embedding,
          metadata: {
            filename: file.name,
            file_type: file.type,
            upload_date: new Date().toISOString(),
          },
        },
      ])

    if (embError) {
      console.error('Error saving embeddings:', embError)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/documents/upload:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * Genera un embedding simple basado en el hash del contenido y frecuencia de palabras
 * En producción, usar un servicio real de embeddings
 */
function generateSimpleEmbedding(text: string): number[] {
  // Array de 384 dimensiones (como modelos pequeños)
  const embedding = new Array(384).fill(0)

  // Normalizar texto
  const normalized = text.toLowerCase().split(/\s+/)

  // Usar frecuencia de palabras para generar embeddings
  for (let i = 0; i < normalized.length && i < embedding.length; i++) {
    const word = normalized[i]
    let hash = 0
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j)
      hash = hash & hash
    }
    embedding[i] = (hash % 100) / 100
  }

  return embedding
}
