import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { taskTitle } = await req.json()

    const prompt = `
    You are an expert productivity assistant for the app "Shigoto".
    Analyze the task: "${taskTitle}".
    Break it down into 3-5 subtasks.
    
    For EACH subtask, determine the "Energy Level" required:
    - "deep": Requires high focus (Coding, Writing, Strategy).
    - "shallow": Requires moderate focus (Emails, Meetings, Calls).
    - "zombie": Requires low focus (Formatting, Data Entry, Simple Research).
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {"title": "Task 1", "energy": "deep"},
      {"title": "Task 2", "energy": "zombie"}
    ]
    Do not include markdown formatting.
    `

    const { text } = await generateText({
      // Using the latest Gemini 2.0 Flash Experimental model
      model: google('gemini-2.5-flash'), 
      prompt: prompt,
    })

    // Clean up response
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '')
    const subtasks = JSON.parse(cleanText)

    return NextResponse.json({ subtasks })
  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 })
  }
}