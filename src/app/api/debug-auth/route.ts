import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/debug-auth
 * 
 * Diagnostic endpoint that reveals the complete auth + RLS state.
 * Visit this URL directly in your browser while logged in to see
 * exactly what the server sees for your session.
 * 
 * DELETE THIS FILE after debugging is complete.
 */
export async function GET() {
  const supabase = await createClient()

  // 1. Who does the server think is logged in?
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({
      status: 'NOT_AUTHENTICATED',
      error: authError?.message ?? 'No user session found in cookies',
      fix: 'You must be logged in. Visit /login first.',
    }, { status: 401 })
  }

  // 2. What does the .eq('user_id', user.id) query return?
  const { data: ownTasks, error: ownError } = await supabase
    .from('tasks')
    .select('id, title, user_id')
    .eq('user_id', user.id)

  // 3. What does a NAKED select (no .eq filter) return?
  //    If RLS is working, this should return ONLY this user's tasks.
  //    If RLS is broken, this returns ALL tasks in the database.
  const { data: allVisibleTasks, error: allError } = await supabase
    .from('tasks')
    .select('id, title, user_id')

  // 4. Check if any visible tasks belong to a DIFFERENT user
  const foreignTasks = (allVisibleTasks ?? []).filter(t => t.user_id !== user.id)

  return NextResponse.json({
    status: 'OK',
    currentUser: {
      id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider ?? 'unknown',
    },
    filteredQuery: {
      description: 'Tasks returned by .eq("user_id", user.id)',
      count: ownTasks?.length ?? 0,
      error: ownError?.message ?? null,
    },
    nakedQuery: {
      description: 'Tasks returned by SELECT * with NO .eq filter (RLS should still filter)',
      count: allVisibleTasks?.length ?? 0,
      error: allError?.message ?? null,
    },
    rlsDiagnosis: foreignTasks.length > 0
      ? {
          status: 'RLS_BROKEN',
          message: `Found ${foreignTasks.length} tasks belonging to OTHER users! RLS is NOT working.`,
          foreignTasks: foreignTasks.map(t => ({ id: t.id, title: t.title, owner: t.user_id })),
        }
      : {
          status: 'RLS_WORKING',
          message: 'All visible tasks belong to the current user. RLS is correctly filtering.',
        },
  })
}
