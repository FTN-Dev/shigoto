import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, currentDate } = await req.json()

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are a task parser. Extract task information from the user's natural language input.

Current date and time: ${currentDate}

Rules:
- Extract a short, clear task TITLE (max 8 words).
- Extract a DESCRIPTION with more detail from what the user said.
- Extract the DEADLINE date and time.
  - If the user gives a specific date and time, use that.
  - If the user says "today" or gives no date at all, use today's date: ${currentDate.split('T')[0]}
  - If the user gives a date but no time, default to 23:59 on that date.
  - Return deadline as ISO 8601 format: YYYY-MM-DDTHH:MM:00
- Return ONLY valid JSON, no markdown, no extra text.

Format:
{"title":"...","description":"...","deadline":"YYYY-MM-DDTHH:MM:00"}

User input: "${prompt}"`,
    })

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanText)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Parse task error:', error)
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 })
  }
}
