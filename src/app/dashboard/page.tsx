'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from '@/components/TaskCard'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GithubCalendar } from '@/components/GithubCalendar'
import {
  Wand2, Loader2, ListTodo, Brain, CheckSquare, Info,
  LayoutDashboard, Target, Zap, Clock, Quote, Flame, LogOut, User
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { subDays, format, isSameDay, differenceInHours } from 'date-fns'

const supabase = createClient()

interface Task {
  id: string
  created_at: string
  title: string
  description?: string | null
  energy_level: string
  status: string
  deadline?: string | null
  completed_at?: string | null
}

type Tab = 'dashboard' | 'pending' | 'board' | 'completed'
type MobileTab = 'deep' | 'shallow' | 'zombie'

const COLORS = {
  deep:    '#a855f7',
  shallow: '#3b82f6',
  zombie:  '#22c55e',
  pending: '#9ca3af',
}

/* ─── themed recharts tooltip style ─────────────────────────────────────── */
function useTooltipStyle() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return {
    contentStyle: {
      borderRadius: '10px',
      border: 'none',
      boxShadow: dark
        ? '0 8px 24px rgba(0,0,0,0.6)'
        : '0 4px 16px rgba(0,0,0,0.12)',
      backgroundColor: dark ? '#0f172a' : '#ffffff',
      color: dark ? '#f1f5f9' : '#1e293b',
      fontSize: 12,
      padding: '8px 12px',
    },
    labelStyle: {
      color: dark ? '#94a3b8' : '#64748b',
      fontWeight: 600,
    },
    itemStyle: { color: dark ? '#f1f5f9' : '#1e293b' },
    cursor: { fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
  }
}

/* ─── custom pie legend ─────────────────────────────────────────────────── */
function PieLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="mt-3 flex flex-col gap-1.5 w-full px-2">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 tabular-nums">{entry.value}</span>
            <span className="text-slate-300 dark:text-slate-600 text-[10px]">
              ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [prioritizing, setPrioritizing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [mobileTab, setMobileTab] = useState<MobileTab>('deep')
  const [aiStream, setAiStream] = useState('')
  const [aiQuote, setAiQuote] = useState<{ quote: string; loading: boolean }>({ quote: '', loading: true })
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const streamRef = useRef<HTMLDivElement>(null)
  const tooltipStyle = useTooltipStyle()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  /* ─── helpers ─────────────────────────────────────────────────────────── */
  const checkAutoPromotions = async (currentTasks: Task[]) => {
    let needsRefresh = false
    const now = new Date()
    for (const task of currentTasks) {
      if (!task.deadline || task.energy_level === 'pending') continue
      const daysUntilDue = (new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      let targetEnergy = task.energy_level
      if (task.energy_level === 'zombie' && daysUntilDue <= 14 && daysUntilDue > 5) targetEnergy = 'shallow'
      else if ((task.energy_level === 'zombie' || task.energy_level === 'shallow') && daysUntilDue <= 5) targetEnergy = 'deep'
      if (targetEnergy !== task.energy_level) {
        await supabase.from('tasks').update({ energy_level: targetEnergy }).eq('id', task.id)
        needsRefresh = true
      }
    }
    if (needsRefresh) await fetchTasks()
  }

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
    if (data) {
      setTasks(data.filter(t => t.status === 'todo'))
      setCompletedTasks(data.filter(t => t.status === 'done'))
      checkAutoPromotions(data.filter(t => t.status === 'todo'))
    }
  }

  const fetchQuote = async (trend: 'up' | 'down', total: number, recent: number) => {
    setAiQuote({ quote: '', loading: true })
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trend, totalTasks: total, recentTasks: recent }),
      })
      const data = await res.json()
      setAiQuote({ quote: data.quote, loading: false })
    } catch {
      setAiQuote({ quote: "Keep pushing forward, you're doing great.", loading: false })
    }
  }

  const completeTask = async (id: string) => {
    await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
    fetchTasks()
  }
  const restoreTask = async (id: string) => {
    await supabase.from('tasks').update({ status: 'todo', completed_at: null }).eq('id', id)
    fetchTasks()
  }
  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }
  const addTasks = async (newTasks: Task[]) => {
    const { error } = await supabase.from('tasks').insert(newTasks)
    if (!error) fetchTasks()
  }

  const runAIPrioritization = async () => {
    const pendingTasks = tasks.filter(t => t.energy_level === 'pending')
    if (pendingTasks.length === 0) return alert('No pending tasks to prioritize!')
    setPrioritizing(true)
    setAiStream('')
    setActiveTab('board')
    try {
      const res = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: pendingTasks }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setAiStream(fullText)
        if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
      }
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const categorized: { id: string; energy_level: string }[] = JSON.parse(jsonMatch[1])
        await Promise.all(categorized.map(({ id, energy_level }) =>
          supabase.from('tasks').update({ energy_level }).eq('id', id)
        ))
        await fetchTasks()
      }
    } catch {
      alert('AI prioritization failed.')
    } finally {
      setPrioritizing(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    fetchTasks()
    const channel = supabase.channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  /* ─── analytics ───────────────────────────────────────────────────────── */
  const analyticsData = useMemo(() => {
    const deepC    = completedTasks.filter(t => t.energy_level === 'deep').length
    const shallowC = completedTasks.filter(t => t.energy_level === 'shallow').length
    const zombieC  = completedTasks.filter(t => t.energy_level === 'zombie').length
    const distribution = [
      { name: 'Deep Focus',   value: deepC,    color: COLORS.deep },
      { name: 'Shallow Work', value: shallowC, color: COLORS.shallow },
      { name: 'Zombie Mode',  value: zombieC,  color: COLORS.zombie },
    ].filter(d => d.value > 0)

    const timeAverages = [
      { name: 'Deep',    totalHours: 0, count: 0, color: COLORS.deep },
      { name: 'Shallow', totalHours: 0, count: 0, color: COLORS.shallow },
      { name: 'Zombie',  totalHours: 0, count: 0, color: COLORS.zombie },
    ]
    completedTasks.forEach(t => {
      if (!t.completed_at || !t.created_at) return
      const hrs = differenceInHours(new Date(t.completed_at), new Date(t.created_at))
      const bucket = timeAverages.find(b => b.name.toLowerCase() === t.energy_level)
      if (bucket) { bucket.totalHours += hrs; bucket.count++ }
    })
    const avgTimeData = timeAverages.map(t => ({
      name: t.name,
      hours: t.count > 0 ? Math.round(t.totalHours / t.count) : 0,
      fill: t.color,
    }))

    const lines = []
    const today = new Date()
    let firstHalfTotal = 0, secondHalfTotal = 0
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i)
      const count = completedTasks.filter(t => t.completed_at && isSameDay(new Date(t.completed_at), d)).length
      lines.push({ date: format(d, 'MMM d'), tasks: count })
      if (i > 3) firstHalfTotal += count
      else secondHalfTotal += count
    }
    const trend: 'up' | 'down' = secondHalfTotal >= firstHalfTotal ? 'up' : 'down'

    return { distribution, avgTimeData, lines, trend, recentTasks: secondHalfTotal + firstHalfTotal }
  }, [completedTasks])

  useEffect(() => {
    if (aiQuote.quote !== '') return
    if (completedTasks.length > 0) fetchQuote(analyticsData.trend, completedTasks.length, analyticsData.recentTasks)
    else fetchQuote('down', 0, 0)
  }, [completedTasks.length])

  /* ─── derived lists ───────────────────────────────────────────────────── */
  const pendingTasks = tasks.filter(t => t.energy_level === 'pending')
  const deepTasks    = tasks.filter(t => t.energy_level === 'deep')
  const shallowTasks = tasks.filter(t => t.energy_level === 'shallow')
  const zombieTasks  = tasks.filter(t => t.energy_level === 'zombie')
  const thinkingText = aiStream.replace(/```json[\s\S]*?```/g, '').trim()

  /* ─── axis colours ────────────────────────────────────────────────────── */
  const axisColor = isDark ? '#475569' : '#94a3b8'
  const gridColor = isDark ? '#1e293b' : '#e2e8f0'

  /* ─── shared card className ───────────────────────────────────────────── */
  const cardCls = `
    shadow-sm hover:shadow-lg
    bg-white dark:bg-slate-900
    border border-slate-200 dark:border-slate-800
    hover:border-purple-200 dark:hover:border-purple-800
    transition-all duration-300
  `

  /* ─── tooltip info tooltip ────────────────────────────────────────────── */
  const InfoTooltip = ({ text, align = 'center' }: { text: string; align?: 'center' | 'right' }) => (
    <div className="group relative ml-1.5 flex items-center">
      <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition-colors" />
      <div
        className={`absolute top-full ${align === 'right' ? 'right-[-10px]' : 'left-1/2 -translate-x-1/2'} mt-2 w-52 p-2.5
          bg-slate-900 dark:bg-slate-100 text-slate-200 dark:text-slate-800
          text-xs rounded-xl shadow-2xl
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 pointer-events-none text-center font-normal leading-relaxed`}
        style={{ zIndex: 9999 }}
      >
        {text}
        <div className={`absolute bottom-full ${align === 'right' ? 'right-3' : 'left-1/2 -translate-x-1/2'} border-[5px] border-transparent border-b-slate-900 dark:border-b-slate-100`} />
      </div>
    </div>
  )

  return (
    <main className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-hidden transition-colors duration-300">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-5 pb-0 max-w-[1600px] w-full mx-auto space-y-3">
        <header className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Flame className="h-7 w-7 text-orange-500 animate-pulse" /> Shigoto
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your energy, not just your time.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="border-purple-300 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 bg-white dark:bg-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0"
              onClick={runAIPrioritization}
              disabled={prioritizing || pendingTasks.length === 0}
            >
              {prioritizing
                ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">AI thinking…</span><span className="sm:hidden">…</span></>
                : <><Wand2 className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">✨ AI Prioritize{pendingTasks.length > 0 ? ` (${pendingTasks.length})` : ''}</span><span className="sm:hidden">✨{pendingTasks.length > 0 ? ` (${pendingTasks.length})` : ''}</span></>
              }
            </Button>
            <CreateTaskDialog onAdd={addTasks} />
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-sm active:scale-95 text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="hidden md:block text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{userEmail}</span>
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Signed in as</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{userEmail}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-slate-200 dark:border-slate-800">
          {([
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'pending',   icon: ListTodo,       label: 'Pending',   badge: pendingTasks.length,   badgeCls: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' },
            { id: 'board',     icon: Target,         label: 'Board',     count: deepTasks.length + shallowTasks.length + zombieTasks.length },
            { id: 'completed', icon: CheckSquare,    label: 'Done',      badge: completedTasks.length,  badgeCls: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' },
          ] as const).map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-all duration-200 shrink-0
                  ${active
                    ? 'bg-white dark:bg-slate-900 border border-b-white dark:border-b-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 -mb-px shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {'badge' in tab && tab.badge && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${tab.badgeCls}`}>{tab.badge}</span>
                )}
                {'count' in tab && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{tab.count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pt-4 max-w-[1600px] w-full mx-auto flex flex-col min-h-0">

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto hide-scrollbar space-y-5 pb-20">

            {/* AI Quote */}
            <Card className="bg-gradient-to-r from-indigo-900 via-purple-900 to-violet-900 text-white border-none shadow-xl shadow-purple-900/30 hover:shadow-2xl hover:shadow-purple-900/40 transition-all duration-300">
              <CardContent className="p-5 md:p-7 flex items-start gap-4">
                <Quote className="h-7 w-7 text-purple-300 shrink-0 opacity-50 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-purple-200 tracking-widest uppercase mb-2">AI Coach Insights</h3>
                  {aiQuote.loading
                    ? <div className="flex items-center gap-2 text-purple-300"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your workflow…</div>
                    : <p className="text-base md:text-lg font-medium leading-relaxed drop-shadow-sm">{aiQuote.quote}</p>
                  }
                </div>
              </CardContent>
            </Card>

            {completedTasks.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                <LayoutDashboard className="h-12 w-12 mx-auto mb-3 opacity-20 text-slate-400" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No Data Yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Complete your first task to unlock the Analytics Dashboard.</p>
              </div>
            ) : (
              <>
                {/* Charts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                  {/* Donut — with legend */}
                  <Card className={cardCls}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                        Task Demographics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-2 pb-4">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.distribution}
                              cx="50%" cy="50%"
                              innerRadius={52} outerRadius={72}
                              paddingAngle={4} dataKey="value"
                              animationBegin={0} animationDuration={800}
                            >
                              {analyticsData.distribution.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} stroke="transparent" />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={tooltipStyle.contentStyle}
                              labelStyle={tooltipStyle.labelStyle}
                              itemStyle={tooltipStyle.itemStyle}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <PieLegend data={analyticsData.distribution} />
                    </CardContent>
                  </Card>

                  {/* 7-Day Velocity */}
                  <Card className={cardCls}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        7-Day Velocity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.lines} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <RechartsTooltip
                            contentStyle={tooltipStyle.contentStyle}
                            labelStyle={tooltipStyle.labelStyle}
                            itemStyle={tooltipStyle.itemStyle}
                          />
                          <Line
                            type="monotone" dataKey="tasks" name="Tasks"
                            stroke="#8b5cf6" strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#8b5cf6', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#a78bfa', stroke: '#8b5cf6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Avg Time Bar */}
                  <Card className={cardCls}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        Avg Hours to Complete
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.avgTimeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <RechartsTooltip
                            contentStyle={tooltipStyle.contentStyle}
                            labelStyle={tooltipStyle.labelStyle}
                            itemStyle={tooltipStyle.itemStyle}
                            cursor={tooltipStyle.cursor}
                          />
                          <Bar dataKey="hours" name="Hours" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* GitHub Calendar */}
                <Card className={`${cardCls} overflow-visible`}>
                  <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 rounded-t-xl">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Target className="h-3.5 w-3.5 text-green-500" />
                      Yearly Consistency Heatmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 overflow-visible">
                    <GithubCalendar completedTasks={completedTasks} />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ── PENDING ───────────────────────────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="h-full overflow-y-auto pb-10">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                <ListTodo className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No pending tasks</p>
                <p className="text-sm mt-1">Add a task above, then run AI Prioritization.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {pendingTasks.length} task{pendingTasks.length > 1 ? 's' : ''} waiting.
                  Click <strong className="text-purple-600 dark:text-purple-400">✨ AI Prioritize</strong> to sort them.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pendingTasks.map(task => <TaskCard key={task.id} task={task} onDelete={deleteTask} onComplete={completeTask} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BOARD ─────────────────────────────────────────────────────── */}
        {activeTab === 'board' && (
          <div className="h-full flex flex-col min-h-0 gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 min-h-0">
              {([
                { id: 'deep',    emoji: '🔥', label: 'Deep Focus',   accent: 'border-t-purple-500', tasks: deepTasks,
                  info: 'High cognitive effort or deadline within 5 days. Attack when energy is highest.' },
                { id: 'shallow', emoji: '⚡', label: 'Shallow Work',  accent: 'border-t-blue-500',   tasks: shallowTasks,
                  info: 'Moderate effort (emails, admin) or deadline within 14 days.' },
                { id: 'zombie',  emoji: '🧟', label: 'Zombie Mode',   accent: 'border-t-green-500',  tasks: zombieTasks,
                  info: 'Low effort tasks with far or no deadlines. Easy on autopilot.' },
              ] as const).map(col => (
                <Card
                  key={col.id}
                  className={`${mobileTab === col.id ? 'flex' : 'hidden'} md:flex flex-col border-t-4 ${col.accent} min-h-0
                    bg-white dark:bg-slate-900
                    border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800
                    shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  <CardHeader className="shrink-0 p-3 md:p-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="flex items-center gap-2 text-sm md:text-base flex-1 text-slate-800 dark:text-slate-100">
                        <span>{col.emoji}</span> {col.label}
                        <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {col.tasks.length}
                        </span>
                      </CardTitle>
                      <InfoTooltip text={col.info} align={col.id === 'zombie' ? 'right' : 'center'} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50/50 dark:bg-slate-950/20">
                    {col.tasks.length === 0
                      ? <p className="text-sm text-slate-400 dark:text-slate-600 italic text-center py-8">All clear here ✓</p>
                      : col.tasks.map(t => <TaskCard key={t.id} task={t} onDelete={deleteTask} onComplete={completeTask} />)
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile column switcher */}
            <div className="md:hidden shrink-0 flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              {([
                { id: 'deep',    emoji: '🔥', label: 'Deep',    cls: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
                { id: 'shallow', emoji: '⚡', label: 'Shallow', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
                { id: 'zombie',  emoji: '🧟', label: 'Zombie',  cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
              ] as const).map(tab => {
                const isActive = mobileTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMobileTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl flex-1 text-sm font-semibold transition-all duration-200
                      ${isActive ? tab.cls + ' scale-105 shadow-inner' : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <span>{tab.emoji}</span>
                    <span className={`transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* AI Terminal */}
            <div className="shrink-0 border border-purple-200/60 dark:border-purple-800/40 rounded-xl bg-slate-950 dark:bg-black overflow-hidden shadow-lg h-44 md:h-52 flex flex-col">
              <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <Brain className="h-3.5 w-3.5 text-purple-400 ml-2" />
                <span className="text-xs font-semibold text-purple-300">AI Thinking</span>
                {prioritizing && <span className="ml-1 flex items-center gap-1 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" />Processing…</span>}
                {!prioritizing && aiStream && (
                  <button onClick={() => setAiStream('')} className="ml-auto text-xs text-slate-600 hover:text-slate-300 transition-colors">Clear</button>
                )}
              </div>
              <div ref={streamRef} className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm text-green-400 whitespace-pre-wrap leading-relaxed">
                {thinkingText
                  ? <>{thinkingText}{prioritizing && <span className="animate-pulse text-purple-400">▋</span>}</>
                  : <div className="h-full flex items-center justify-center">
                      <span className="text-slate-600 italic text-center text-xs">
                        {prioritizing ? 'Waiting for AI response…' : 'No activity yet. Add pending tasks and click ✨ AI Prioritize.'}
                      </span>
                    </div>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETED ─────────────────────────────────────────────────── */}
        {activeTab === 'completed' && (
          <div className="h-full overflow-y-auto pb-10">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                <CheckSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No completed tasks</p>
                <p className="text-sm mt-1">Finish tasks on the board to see them here.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  You have finished <strong className="text-green-600 dark:text-green-400">{completedTasks.length} task{completedTasks.length > 1 ? 's' : ''}</strong> 🎉
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {completedTasks.map(task => <TaskCard key={task.id} task={task} onDelete={deleteTask} onRestore={restoreTask} />)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}