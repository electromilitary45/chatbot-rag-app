import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats:', error)
      return NextResponse.json(
        { error: 'Error al obtener chats' },
        { status: 500 }
      )
    }

    return NextResponse.json(chats || [])
  } catch (error) {
    console.error('Error in GET /api/chats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
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

    const { title } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título del chat es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: chat, error } = await supabase
      .from('chats')
      .insert([
        {
          user_id: session.user.id,
          title: title.trim(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating chat:', error)
      return NextResponse.json(
        { error: 'Error al crear chat' },
        { status: 500 }
      )
    }

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/chats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
