import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Determine the base URL (handles Vercel preview + production correctly)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this was an email confirmation (type=signup in next param)
      // vs a normal OAuth sign-in
      const type = searchParams.get('type')
      if (type === 'signup' || next === '/') {
        // Email confirmed — send to login with a success message
        return NextResponse.redirect(
          `${baseUrl}/login?message=${encodeURIComponent('Email confirmed! You can now sign in.')}`
        )
      }
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(
    `${baseUrl}/login?error=${encodeURIComponent('Could not confirm your email. The link may have expired.')}`
  )
}
