import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

// Use gemini-2.0-flash — it streams tokens immediately without a "thinking" phase.
// gemini-2.5-flash has extended internal reasoning that can silently delay the
// first token by 30–60 s, making the UI appear frozen for short task lists.
const MODEL = google('gemini-2.0-flash')

export async function POST(req: NextRequest) {
  const { tasks } = await req.json()

  if (!tasks || tasks.length === 0) {
    return new Response(JSON.stringify({ error: 'No tasks provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()

  const taskList = tasks
    .map((t: { id: string; title: string; deadline?: string | null }) => {
      let deadlineStr = 'no deadline'
      if (t.deadline) {
        const dl = new Date(t.deadline)
        const days = Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        deadlineStr = `${dl.toLocaleDateString('en-GB')} (${
          days > 0 ? `${days} days away` : days === 0 ? 'TODAY' : `${Math.abs(days)} days OVERDUE`
        })`
      }
      return `  • [${t.id}] "${t.title}" — Deadline: ${deadlineStr}`
    })
    .join('\n')

  const prompt = `You are a productivity expert helping categorize tasks into energy levels for the app "Shigoto".
Current date/time: ${now.toLocaleString()}

ENERGY LEVEL RULES (deadline urgency takes priority):
- "deep"    → due within 5 days, OR cognitively demanding (coding, research, writing, strategy)
- "shallow" → due in 6–14 days, OR moderate effort (emails, reviews, admin, meetings)
- "zombie"  → due in 15+ days or no deadline, low effort (data entry, formatting, simple lookups)

Tasks to categorize:
${taskList}

Instructions:
1. Think through each task briefly — mention deadline urgency and task complexity.
2. State your decision.
3. After analyzing ALL tasks, output ONLY this JSON block and nothing after it:

\`\`\`json
[{"id":"<task-id>","energy_level":"<deep|shallow|zombie>","reason":"<one sentence>"}]
\`\`\`

Begin:`

  try {
    const result = streamText({ model: MODEL, prompt })

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (err) {
          // Stream error — send a machine-readable error marker so the client
          // can show a helpful message rather than an infinite spinner.
          controller.enqueue(
            encoder.encode(`\n\n[STREAM_ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Prioritize API error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'AI request failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
