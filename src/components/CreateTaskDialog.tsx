'use client'

import { useState } from 'react'
import { Task } from '@/types/index'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2, Sparkles, Calendar, FileText, Tag, RotateCcw } from 'lucide-react'

type CreateTaskDialogProps = {
  onAdd: (tasks: Task[]) => void
}

interface ParsedTask {
  title: string
  description: string
  deadline: string
}

function formatDeadlineDisplay(iso: string): string {
  const d = new Date(iso)
  const dd  = String(d.getDate()).padStart(2, '0')
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const yy  = String(d.getFullYear()).slice(2)
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yy} ${hh}:${min}`
}

export function CreateTaskDialog({ onAdd }: CreateTaskDialogProps) {
  const [open, setOpen]       = useState(false)
  const [prompt, setPrompt]   = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed]   = useState<ParsedTask | null>(null)
  const [error, setError]     = useState('')

  const handleParse = async () => {
    if (!prompt.trim()) return
    setParsing(true)
    setError('')
    setParsed(null)
    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), currentDate: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Parse failed')
      setParsed(await res.json())
    } catch {
      setError('AI could not read your task. Try rephrasing it.')
    } finally {
      setParsing(false)
    }
  }

  const handleAdd = () => {
    if (!parsed) return
    onAdd([{
      title: parsed.title,
      description: parsed.description || null,
      energy_level: 'pending',
      deadline: parsed.deadline || null,
    } as Task])
    setOpen(false)
    setPrompt('')
    setParsed(null)
  }

  const handleReset = () => { setParsed(null); setError('') }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) { setPrompt(''); setParsed(null); setError('') }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30
            active:scale-95 active:translate-y-0"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">

        {/* Header — adapts to theme */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-6 pb-5 border-b border-slate-200 dark:border-slate-700/60">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white flex items-center gap-2 text-lg font-semibold">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              Describe your task
            </DialogTitle>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
              Write naturally — AI will extract the title, description, and deadline.
            </p>
          </DialogHeader>

          {/* Input area */}
          {!parsed && (
            <div className="mt-4 space-y-3">
              <textarea
                className="
                  w-full resize-none rounded-xl p-4 text-sm leading-relaxed
                  bg-white dark:bg-slate-800/80
                  border border-slate-200 dark:border-slate-700
                  text-slate-800 dark:text-white
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-all duration-200
                  shadow-sm
                "
                rows={5}
                placeholder={`e.g. "Math Homework about integrals, 20 hard questions. Deadline 01/04/2026 15:00"\n\nIf you don't mention a date, today will be used.`}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParse() }}
                disabled={parsing}
                autoFocus
              />
              {error && <p className="text-red-500 dark:text-red-400 text-xs font-medium">{error}</p>}
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 active:translate-y-0"
                onClick={handleParse}
                disabled={parsing || !prompt.trim()}
              >
                {parsing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI is reading your task…</>
                  : <><Sparkles className="mr-2 h-4 w-4" />Parse with AI<span className="ml-2 text-xs opacity-50">Ctrl+Enter</span></>
                }
              </Button>
            </div>
          )}
        </div>

        {/* Parsed result */}
        {parsed && (
          <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              AI Extracted
            </p>

            <div className="space-y-2.5">
              <div className="flex gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/40 rounded-md shrink-0 mt-0.5">
                  <Tag className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Title</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{parsed.title}</p>
                </div>
              </div>

              {parsed.description && (
                <div className="flex gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-md shrink-0 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Description</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{parsed.description}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors">
                <div className="p-1 bg-orange-100 dark:bg-orange-900/40 rounded-md shrink-0 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Deadline</p>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {parsed.deadline ? formatDeadlineDisplay(parsed.deadline) : 'No deadline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Re-write
              </Button>
              <Button
                className="flex-1 bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0"
                onClick={handleAdd}
              >
                <Plus className="mr-2 h-3.5 w-3.5" /> Add to Board
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}