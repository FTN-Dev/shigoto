// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — client is only created on first use, never at module load
// time. This prevents build-time crashes when env vars aren't available during
// Next.js static prerendering on Vercel.
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  _client = createClient(url, key)
  return _client
}

// Convenience re-export so existing `supabase.from(...)` call-sites keep working
// without any changes — the getter is called on first property access.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})