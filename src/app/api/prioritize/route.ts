import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { tasks } = await req.json()

  if (!tasks || tasks.length === 0) {
    return new Response(JSON.stringify({ error: 'No tasks' }), { status: 400 })
  }

  const now = new Date()
  const taskList = tasks.map((t: { id: string; title: string; deadline?: string | null }) => {
    let deadlineStr = 'no deadline'
    if (t.deadline) {
      const dl = new Date(t.deadline)
      const days = Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      deadlineStr = `${dl.toLocaleDateString('en-GB')} (${days > 0 ? days + ' days away' : days === 0 ? 'TODAY' : Math.abs(days) + ' days OVERDUE'})`
    }
    return `  • [${t.id}] "${t.title}" — Deadline: ${deadlineStr}`
  }).join('\n')

  const prompt = `You are a productivity expert helping categorize tasks into energy levels for the app "Shigoto".
Current date/time: ${now.toLocaleString()}

ENERGY LEVEL RULES (deadline urgency takes priority):
- "deep" → due within 5 days, or genuinely complex and cognitively demanding (coding, research, strategy)
- "shallow" → due in 6–14 days, or moderate effort (emails, reviews, admin, meetings)
- "zombie" → due in 15+ days or no deadline, low effort (data entry, formatting, simple lookups)

Tasks to analyze:
${taskList}

Step 1: For each task, think through it out loud. Mention the deadline urgency and task type.
Step 2: State your decision clearly.
Step 3: After ALL tasks are analyzed, output ONLY the following JSON block (no text after it):

\`\`\`json
[{"id":"<task-id>","energy_level":"<deep|shallow|zombie>","reason":"<one sentence why>"}]
\`\`\`

Start thinking now:`

  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt,
  })

  // Return a plain text stream so the client can read chunks in real-time
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of result.textStream) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
