import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const stats = await req.json()
    // stats example: { trend: 'up' | 'down', totalTasks: number, recentTasks: number }

    let prompt = `You are Shigoto's AI productivity coach.
The user is viewing their task analytics dashboard.
They have completed a total of ${stats.totalTasks} tasks. Over the last 7 days, they completed ${stats.recentTasks} tasks.
The current trend is ${stats.trend === 'up' ? 'UP (they are working hard and checking off lots of things)' : 'DOWN (they are completing fewer tasks than usual)'}.

If the trend is DOWN: Write a short, powerful, 1-2 sentence motivational quote to get them back on track. Be encouraging, not mean.
If the trend is UP: Write a short, powerful, 1-2 sentence quote praising their hard work and gently reminding them that it's okay to rest and pace themselves.

Do not use quotation marks around the text. Do not write anything else. Just the quote.`

    if (stats.totalTasks === 0) {
      prompt = `You are Shigoto's AI productivity coach. The user hasn't completed any tasks yet. Write a very short, warm, welcoming 1-sentence quote encouraging them to start their first task.`
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    })

    return NextResponse.json({ quote: text.trim() })
  } catch (error) {
    console.error('Quote error:', error)
    return NextResponse.json({ quote: "Every step forward, no matter how small, is progress. Keep going." })
  }
}
