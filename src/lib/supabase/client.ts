import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a fresh Supabase browser client bound to the current document cookies.
 *
 * IMPORTANT: Call this inside a React component (with useMemo), NOT at module level.
 * @supabase/ssr's createBrowserClient has its own internal singleton keyed by URL+key,
 * but it always reads cookies at call time, so calling it fresh inside the component
 * ensures the auth session reflects the currently logged-in user — not a cached one
 * from a previous login session.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
