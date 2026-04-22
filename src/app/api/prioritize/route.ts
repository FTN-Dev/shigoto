import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  let tasks: { id: string; title: string; deadline?: string | null }[]

  try {
    const body = await req.json()
    tasks = body.tasks
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!tasks || tasks.length === 0) {
    return Response.json({ error: 'No tasks provided' }, { status: 400 })
  }

  const now = new Date()

  const taskList = tasks
    .map(t => {
      let deadlineStr = 'no deadline'
      if (t.deadline) {
        const dl = new Date(t.deadline)
        const days = Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        deadlineStr = `${dl.toLocaleDateString('en-GB')} (${
          days > 0 ? `${days} days away`
          : days === 0 ? 'TODAY'
          : `${Math.abs(days)} days OVERDUE`
        })`
      }
      return `  • [${t.id}] "${t.title}" — Deadline: ${deadlineStr}`
    })
    .join('\n')

  const prompt = `You are a productivity expert categorizing tasks for "Shigoto".
ENERGY LEVEL RULES:
Deadlines are the ABSOLUTE authority. Do NOT override the deadline rule because of task complexity.
- "deep"    → due ≤ 5 days. Must be urgently completed within the week.
- "shallow" → due 6–14 days. Still has a week or two left.
- "zombie"  → due ≥ 15 days or no deadline. Safely in the future.

Secondary Rule: Only if two tasks have the EXACT SAME urgency, mark the harder one higher. Otherwise, strictly obey the deadlines provided!

Tasks to categorize:
${taskList}

Think through each task briefly, then output ONLY this JSON block with NO text after it:

\`\`\`json
[{"id":"<task-id>","energy_level":"<deep|shallow|zombie>","reason":"<one sentence>"}]
\`\`\`

Begin analysis:`

  try {
    // gemini-1.5-flash is supported by all SDK versions (avoids dev server restart bugs)
    const result = streamText({
      model: google('gemini-1.5-flash'),
      prompt,
      maxTokens: 2048,
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (streamErr) {
          const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr)
          console.error('[prioritize] stream error:', errMsg)
          controller.enqueue(encoder.encode(`\n\n[STREAM_ERROR] ${errMsg}`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[prioritize] setup error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
