import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'
import ChatList from '@/components/dashboard/chat-list'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Mis Chats</h1>
          <p className="text-gray-600 text-sm">Selecciona un chat o crea uno nuevo</p>
        </header>

        {/* Chat List */}
        <div className="flex-1 overflow-auto p-6">
          <ChatList userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
