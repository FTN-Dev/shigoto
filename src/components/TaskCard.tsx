'use client'

import { Task } from '@/types/index'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Trash2, Zap, AlertCircle, ArrowUpCircle } from 'lucide-react'

type TaskCardProps = {
  task: Task;
  onDelete: (id: string) => void;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
}

const energyConfig: Record<string, { bandColor: string; bandText: string }> = {
  deep: {
    bandColor: 'bg-purple-500',
    bandText: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50'
  },
  shallow: {
    bandColor: 'bg-blue-500',
    bandText: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50'
  },
  zombie: {
    bandColor: 'bg-green-500',
    bandText: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50'
  },
  pending: {
    bandColor: 'bg-slate-300 dark:bg-slate-700',
    bandText: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
  }
}

function formatFullDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function TaskCard({ task, onDelete, onComplete, onRestore }: TaskCardProps) {
  const { bandColor, bandText } = energyConfig[task.energy_level] ?? energyConfig.pending
  const deadlineFormatted = formatFullDate(task.deadline)
  const overdue = isOverdue(task.deadline)

  return (
    <Card className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-200 dark:hover:border-purple-800 flex flex-col min-h-[120px]">
      <div className={`h-1.5 w-full ${bandColor} transition-colors`} />
      <CardContent className="p-3 md:p-4 flex flex-1 gap-3">
        <div className="flex-1 flex flex-col">
          <div className="pb-2 flex justify-between items-start gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
              {task.title}
            </h3>
            {task.status !== 'done' && (
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${bandText}`}>
                {task.energy_level}
              </span>
            )}
          </div>
          
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-3 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="mt-auto pt-2 space-y-1 text-slate-400 dark:text-slate-500 text-xs">
            {overdue && task.status !== 'done' && (
              <div className="flex items-center gap-1.5 text-red-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Overdue!</span>
              </div>
            )}

            {/* Dates row */}
            <div className="pt-1 flex flex-col gap-1">
              {deadlineFormatted && task.status !== 'done' && (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  overdue ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50' : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50'
                }`}>
                  <Clock className="h-3 w-3" />
                  {overdue ? 'Overdue: ' : 'Due: '}{deadlineFormatted}
                </span>
              )}
              {task.status === 'done' && task.completed_at && (
                <span className="inline-flex flex-wrap items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900/50">
                  <CheckCircle className="h-3 w-3" />
                  Completed: {formatFullDate(task.completed_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          {task.status === 'todo' && onComplete && (
            <button 
              onClick={() => onComplete(task.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/40 dark:text-slate-500 dark:hover:text-green-400 transition-colors"
              title="Mark Complete"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {task.status === 'done' && onRestore && (
            <button 
              onClick={() => onRestore(task.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors"
              title="Restore to Board"
            >
              <ArrowUpCircle className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}