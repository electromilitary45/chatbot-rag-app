import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'
import ChatMessages from '@/components/dashboard/chat-messages'
import ChatInput from '@/components/dashboard/chat-input'

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const supabase = await createClient()

  // Obtener el chat
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (chatError || !chat) {
    redirect('/dashboard')
  }

  // Obtener los mensajes del chat
  const { data: messages = [] } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">{chat.title}</h1>
          <p className="text-gray-600 text-sm">
            Creado el {new Date(chat.created_at).toLocaleDateString('es-ES')}
          </p>
        </header>

        {/* Messages Area */}
        <ChatMessages initialMessages={messages || []} chatId={id} />

        {/* Input Area */}
        <ChatInput chatId={id} />
      </div>
    </div>
  )
}
