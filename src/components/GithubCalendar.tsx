'use client'

import { useMemo, useState } from 'react'
import { startOfYear, endOfYear, eachDayOfInterval, format, getDay, getMonth } from 'date-fns'

interface GithubCalendarProps {
  completedTasks: { id: string; completed_at?: string | null }[]
}

const YEARS = [2024, 2025, 2026]

const LEGEND = [
  { label: '0', light: '#ebedf0', dark: '#161b22' },
  { label: '1–2', light: '#9be9a8', dark: '#0e4429' },
  { label: '3–4', light: '#40c463', dark: '#006d32' },
  { label: '5–7', light: '#30a14e', dark: '#26a641' },
  { label: '8+', light: '#216e39', dark: '#39d353' },
]

function getDayColor(count: number, isDark: boolean): string {
  if (count <= 0) return isDark ? '#161b22' : '#ebedf0'
  if (count <= 2)  return isDark ? '#0e4429' : '#9be9a8'
  if (count <= 4)  return isDark ? '#006d32' : '#40c463'
  if (count <= 7)  return isDark ? '#26a641' : '#30a14e'
  return isDark ? '#39d353' : '#216e39'
}

export function GithubCalendar({ completedTasks }: GithubCalendarProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  // Read theme from document instead of useTheme to avoid SSR issues
  const [, forceUpdate] = useState(0)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const calendarData = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1))
    const end = endOfYear(start)
    const days = eachDayOfInterval({ start, end })

    const taskMap = new Map<string, number>()
    completedTasks.forEach(t => {
      if (!t.completed_at) return
      const dString = format(new Date(t.completed_at), 'yyyy-MM-dd')
      taskMap.set(dString, (taskMap.get(dString) || 0) + 1)
    })

    const weeks: { date: Date; count: number; isReal: boolean }[][] = []
    let currentWeek: { date: Date; count: number; isReal: boolean }[] = []
    let currentMonth = -1
    const monthLabels: { label: string; colIndex: number }[] = []

    // Pad so week starts on Sunday
    const firstDayOfWeek = getDay(days[0])
    for (let i = 0; i < firstDayOfWeek; i++) {
      const dummyDate = new Date(start)
      dummyDate.setDate(dummyDate.getDate() - (firstDayOfWeek - i))
      currentWeek.push({ date: dummyDate, count: -1, isReal: false })
    }

    days.forEach(day => {
      const month = getMonth(day)
      if (month !== currentMonth) {
        currentMonth = month
        monthLabels.push({ label: format(day, 'MMM'), colIndex: weeks.length })
      }

      const count = taskMap.get(format(day, 'yyyy-MM-dd')) || 0
      currentWeek.push({ date: day, count, isReal: true })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(start), count: -1, isReal: false })
      }
      weeks.push(currentWeek)
    }

    return { weeks, monthLabels }
  }, [completedTasks, selectedYear])

  return (
    <div className="flex flex-col gap-4">
      {/* Year Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
                selectedYear === year
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Less</span>
          {LEGEND.map((leg) => (
            <div
              key={leg.label}
              title={leg.label + ' tasks'}
              className="w-3 h-3 rounded-sm ring-1 ring-black/10 dark:ring-white/10"
              style={{ backgroundColor: isDark ? leg.dark : leg.light }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Heatmap — overflow-visible is key so tooltips don't get clipped */}
      <div className="w-full overflow-x-auto pb-4" style={{ overflowY: 'visible' }}>
        <div className="min-w-max relative pl-8" style={{ overflow: 'visible' }}>

          {/* Day-of-week labels */}
          <div className="absolute left-0 top-6 flex flex-col text-[10px] text-slate-400 dark:text-slate-500 font-medium" style={{ gap: '3px', height: '105px', justifyContent: 'space-between' }}>
            <span className="invisible">Su</span>
            <span>Mo</span>
            <span className="invisible">Tu</span>
            <span>We</span>
            <span className="invisible">Th</span>
            <span>Fr</span>
            <span className="invisible">Sa</span>
          </div>

          {/* Month labels */}
          <div className="h-5 relative text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1">
            {calendarData.monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute truncate"
                style={{ left: `${m.colIndex * 15}px`, width: '30px' }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid — overflow visible so tooltip pops above parent */}
          <div className="flex" style={{ gap: '3px', overflow: 'visible' }}>
            {calendarData.weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col" style={{ gap: '3px', overflow: 'visible' }}>
                {week.map((day, dIdx) => {
                  if (!day.isReal) {
                    return <div key={dIdx} style={{ width: 12, height: 12 }} />
                  }

                  const bgColor = getDayColor(day.count, isDark)
                  const hoverColor = day.count > 0
                    ? getDayColor(Math.min(day.count + 2, 9), isDark)
                    : isDark ? '#21262d' : '#d1d5db'

                  return (
                    <div
                      key={dIdx}
                      className="relative group"
                      style={{ width: 12, height: 12, overflow: 'visible' }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: bgColor,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
                          transition: 'transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 1,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.transform = 'scale(1.7)'
                          el.style.backgroundColor = hoverColor
                          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'
                          el.style.zIndex = '10'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.transform = 'scale(1)'
                          el.style.backgroundColor = bgColor
                          el.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.06)'
                          el.style.zIndex = '1'
                        }}
                      />
                      {/* Tooltip — rendered in fixed position using group-hover */}
                      <div
                        className="
                          pointer-events-none
                          absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                          px-2.5 py-1.5
                          bg-slate-900 dark:bg-white
                          text-white dark:text-slate-900
                          text-[11px] font-medium rounded-lg
                          shadow-xl
                          whitespace-nowrap
                          opacity-0 group-hover:opacity-100
                          transition-opacity duration-150
                        "
                        style={{ zIndex: 9999 }}
                      >
                        <span className="font-semibold">{format(day.date, 'MMM d, yyyy')}</span>
                        <br />
                        <span className="text-slate-300 dark:text-slate-600 font-normal">
                          {day.count} task{day.count !== 1 ? 's' : ''} completed
                        </span>
                        {/* Arrow */}
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-slate-900 dark:border-t-white"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Bottom legend for colour meaning */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {[
              { label: 'No tasks', color: isDark ? '#161b22' : '#ebedf0' },
              { label: '1–2 tasks', color: isDark ? '#0e4429' : '#9be9a8' },
              { label: '3–4 tasks', color: isDark ? '#006d32' : '#40c463' },
              { label: '5–7 tasks', color: isDark ? '#26a641' : '#30a14e' },
              { label: '8+ tasks',  color: isDark ? '#39d353' : '#216e39' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div
                  className="w-3 h-3 rounded-sm ring-1 ring-black/10 dark:ring-white/10"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
