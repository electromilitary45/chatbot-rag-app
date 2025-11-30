import { auth } from '@/lib/auth'
import LoginButton from '@/components/login-button'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          🤖 Chatbot RAG
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Chatbot inteligente con memoria y documentos
        </p>
        
        <LoginButton session={session} />
        
        {session && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 text-center">
              ¡Hola {session.user?.name}! 🎉
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
