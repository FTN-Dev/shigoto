import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Flame, Wand2, Brain, BarChart3, GitCommitHorizontal, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

// If Supabase email confirmation lands here with ?code=... (happens when
// Site URL is localhost), forward it to the real callback handler.
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>
}) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }
  if (params.error) {
    redirect(`/login?error=${encodeURIComponent(params.error_description ?? params.error)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight select-none group">
            <Flame className="h-6 w-6 text-orange-500 transition-transform group-hover:scale-110 duration-200" />
            <span className="text-slate-800 dark:text-slate-100">Shigoto</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-sm font-medium">
            <Zap className="h-3.5 w-3.5" /> AI-Powered Task Management
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Manage your{' '}
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
              energy
            </span>
            ,<br className="hidden md:block" /> not just your time.
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Shigoto uses AI to categorise your tasks by cognitive demand — so you always know what to work on and when, based on how you actually feel.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="group flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="px-7 py-3.5 text-base font-medium rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5 shadow-sm transition-all duration-300 active:scale-95"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-xs text-slate-400 dark:text-slate-600 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Free to use · No credit card required · Backed by Google Gemini AI
          </p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6 bg-white/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Everything you need to do deep work
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Purpose-built for people who want to protect their most valuable resource — cognitive energy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="h-6 w-6 text-purple-500" />,
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                border: 'border-purple-100 dark:border-purple-900/40',
                title: 'AI Task Parsing',
                desc: 'Describe your task in plain language. AI extracts the title, description, and deadline — no forms to fill in.',
              },
              {
                icon: <Wand2 className="h-6 w-6 text-violet-500" />,
                bg: 'bg-violet-50 dark:bg-violet-900/20',
                border: 'border-violet-100 dark:border-violet-900/40',
                title: 'Smart Prioritisation',
                desc: 'One click sorts all pending tasks into Deep Focus, Shallow Work, or Zombie Mode columns automatically.',
              },
              {
                icon: <Zap className="h-6 w-6 text-blue-500" />,
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-100 dark:border-blue-900/40',
                title: 'Energy-Based Board',
                desc: 'Your board adapts to your energy. Tackle 🔥 Deep Focus tasks when sharp, 🧟 Zombie Mode when tired.',
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-green-500" />,
                bg: 'bg-green-50 dark:bg-green-900/20',
                border: 'border-green-100 dark:border-green-900/40',
                title: 'Analytics Dashboard',
                desc: 'Pie, line, and bar charts reveal your productivity patterns. Know when you do your best work.',
              },
              {
                icon: <GitCommitHorizontal className="h-6 w-6 text-orange-500" />,
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                border: 'border-orange-100 dark:border-orange-900/40',
                title: 'Streak Heatmap',
                desc: 'A GitHub-style yearly contribution graph tracks your streaks and shows which days you were on fire.',
              },
              {
                icon: <Flame className="h-6 w-6 text-rose-500" />,
                bg: 'bg-rose-50 dark:bg-rose-900/20',
                border: 'border-rose-100 dark:border-rose-900/40',
                title: 'AI Coach Insights',
                desc: 'A daily motivational quote, personalised to your trend — whether you\'re on a roll or need a nudge.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border ${f.border} ${f.bg} p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
            Ready to work smarter?
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Join Shigoto and start managing your cognitive energy like a pro. Free, forever.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            Create your free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Shigoto · Built with Next.js, Supabase &amp; Google Gemini
      </footer>
    </div>
  )
}
