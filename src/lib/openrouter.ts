import OpenAI from 'openai'

// Cliente Ollama
function getOllamaClient(): OpenAI {
  return new OpenAI({
    apiKey: 'ollama', // Ollama no requiere API key real
    baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
  })
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatContext {
  messages: Message[]
  maxTokens?: number
  temperature?: number
  ragContext?: string // Contexto de documentos RAG
}

/**
 * Genera una respuesta usando Ollama con contexto RAG
 */
export async function generateChatResponse(context: ChatContext): Promise<string> {
  try {
    const client = getOllamaClient()
    const model = process.env.OLLAMA_MODEL || 'mistral'

    // Preparar mensajes con contexto RAG si está disponible
    const systemPrompt = context.ragContext
      ? `Eres un asistente inteligente con acceso a documentos. Usa la siguiente información para responder:\n\n${context.ragContext}\n\nResponde en español, de manera clara y concisa.`
      : 'Eres un asistente inteligente. Responde en español, de manera clara y concisa.'

    const messages: Message[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...context.messages,
    ]

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: context.temperature || 0.7,
      max_tokens: context.maxTokens || 1000,
    })

    const responseMessage = response.choices[0]?.message?.content || ''

    if (!responseMessage) {
      throw new Error('Sin respuesta de Ollama')
    }

    return responseMessage
  } catch (error) {
    console.error('Error en generateChatResponse:', error)
    throw error
  }
}

/**
 * Genera embeddings para un texto (para RAG)
 */
export async function generateEmbeddings(): Promise<number[]> {
  try {
    // Placeholder: implementar con Cohere, Sentence Transformers, etc.
    console.warn('Embeddings not implemented yet. Using placeholder.')
    return Array(1536).fill(0)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

/**
 * Procesa un documento para RAG (extrae texto, genera embeddings)
 */
export async function processDocumentForRAG(
  documentPath: string
): Promise<{ content: string; embeddings: number[] }> {
  try {
    // Placeholder: implementar procesamiento real de documentos
    // Para imágenes: usar OCR o vision API
    // Para PDFs: usar pdfjs-dist
    // Para texto: directamente

    const content = `Contenido del documento: ${documentPath}`
    const embeddings = await generateEmbeddings()

    return { content, embeddings }
  } catch (error) {
    console.error('Error processing document:', error)
    throw error
  }
}

/**
 * Busca documentos relevantes para una consulta (RAG retrieval)
 */
export async function retrieveRelevantDocuments(
  query: string,
  userDocuments: Array<{ id: string; content: string; embeddings: number[] }>,
  topK: number = 3
): Promise<string> {
  try {
    // Implementar búsqueda por similitud de embeddings
    // Por ahora, retornar todos los documentos

    if (userDocuments.length === 0) {
      return ''
    }

    const relevantDocs = userDocuments
      .slice(0, topK)
      .map((doc) => doc.content)
      .join('\n\n')

    return `Documentos relevantes:\n${relevantDocs}`
  } catch (error) {
    console.error('Error retrieving documents:', error)
    throw error
  }
}
