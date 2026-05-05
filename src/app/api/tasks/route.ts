import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/tasks — returns ONLY the current authenticated user's tasks
export async function GET() {
  const supabase = await createClient()

  // Server-side session validation — reads HTTP cookies, never touches localStorage
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)   // explicit filter: defence-in-depth on top of RLS
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the resolved userId alongside tasks so the client can verify them
  return NextResponse.json({ tasks: tasks ?? [], userId: user.id })
}

// POST /api/tasks — insert one or more tasks for the current user
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const newTasks = (Array.isArray(body) ? body : [body]).map((t: Record<string, unknown>) => ({
    ...t,
    user_id: user.id,   // always stamp with the server-verified user id
  }))

  const { error } = await supabase.from('tasks').insert(newTasks)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/tasks — update a single task (only if it belongs to the current user)
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 })

  const { error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .eq('user_id', user.id)   // cannot touch another user's row

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/tasks — delete a single task owned by the current user
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 })

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
