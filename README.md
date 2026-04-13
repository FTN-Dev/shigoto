# 仕事 Shigoto — AI-Powered Task Manager

> **Manage your energy, not just your time.**

Shigoto is a smart task management dashboard built with Next.js 16, Supabase, and Google Gemini AI. It automatically categorises your tasks by cognitive load (Deep Focus, Shallow Work, Zombie Mode), tracks your streaks, and generates personalised motivational coaching.

---

## ✨ Features

- **AI Task Parsing** — describe a task in natural language; AI extracts title, description & deadline
- **AI Prioritisation** — one-click Gemini-powered categorisation of pending tasks
- **Energy-Based Board** — 🔥 Deep Focus / ⚡ Shallow Work / 🧟 Zombie Mode columns
- **Analytics Dashboard** — pie, line & bar charts via Recharts
- **GitHub-style Streak Heatmap** — yearly contribution graph with per-day tooltips
- **AI Motivational Coach** — a daily quote tuned to your completion trend
- **Dark / Light Mode** — persisted via `next-themes`
- **Real-time Updates** — Supabase Postgres CDC subscription

---

## 🚀 Getting Started Locally

### 1. Clone the repo
```bash
git clone https://github.com/FTN-Dev/shigoto.git
cd shigoto
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Then fill in your values in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |

### 4. Set up the Supabase `tasks` table
Run this SQL in the **Supabase SQL Editor**:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  title         text NOT NULL,
  description   text,
  energy_level  text NOT NULL DEFAULT 'pending',
  status        text NOT NULL DEFAULT 'todo',
  deadline      timestamptz,
  completed_at  timestamptz
);
```

### 5. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this on GitHub)
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → select `FTN-Dev/shigoto`
3. Under **Environment Variables**, add all three keys from your `.env.local`
4. Click **Deploy** — Vercel auto-detects Next.js, no extra config needed

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini via `@ai-sdk/google` |
| Charts | Recharts |
| Theme | next-themes |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── prioritize/   # AI task categorisation stream
│   │   ├── parse-task/   # AI task natural language parser
│   │   └── quote/        # AI motivational quote generator
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Main dashboard
├── components/
│   ├── CreateTaskDialog.tsx
│   ├── GithubCalendar.tsx
│   ├── TaskCard.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
├── lib/
│   └── supabase.ts
└── types/
    └── index.ts
```
