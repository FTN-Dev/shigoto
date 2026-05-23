# 仕事 Shigoto — AI-Powered Task Manager

> **Manage your energy, not just your time.**

Shigoto is a smart task management dashboard built with Next.js 16, Supabase, and Google Gemini AI. It automatically categorises your tasks by cognitive load (Deep Focus, Shallow Work, Zombie Mode), tracks your streaks, and generates personalised motivational coaching.

---

## ✨ Features

- **AI Task Parsing** — describe a task in natural language; AI extracts title, description & deadline
- **AI Prioritisation** — one-click Gemini-powered categorisation of pending tasks
- **Energy-Based Kanban Board** — 🔥 Deep Focus / ⚡ Shallow Work / 🧟 Zombie Mode columns
- **Auto-Promotion** — tasks automatically move up as deadlines approach (≤14 days → Shallow, ≤5 days → Deep)
- **Analytics Dashboard** — pie, line & bar charts via Recharts
- **GitHub-style Streak Heatmap** — 365-day contribution graph with per-day tooltips
- **AI Motivational Coach** — a daily quote tuned to your completion trend
- **Dark / Light Mode** — persisted via `next-themes`
- **Real-time Updates** — Supabase Postgres CDC subscription
- **Multi-user Auth** — email/password + Google OAuth, strict per-user data isolation via RLS

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI | Google Gemini via `@ai-sdk/google` |
| Charts | Recharts |
| Theme | next-themes |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tasks/        # Server-side task CRUD (auth-validated)
│   │   ├── prioritize/   # AI task categorisation stream
│   │   ├── parse-task/   # AI task natural language parser
│   │   └── quote/        # AI motivational quote generator
│   ├── auth/callback/    # OAuth redirect handler
│   ├── dashboard/        # Main app dashboard
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── components/
│   ├── CreateTaskDialog.tsx
│   ├── GithubCalendar.tsx
│   ├── TaskCard.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
└── lib/
    └── supabase/
        ├── client.ts     # Browser client
        ├── server.ts     # Server-side client (SSR)
        └── middleware.ts # Session refresh middleware
```

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

Create `.env.local` in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

> See **Full Deployment Guide** below for where to get each value.

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Full Deployment Guide

### Part 1 — Supabase Setup

#### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** `shigoto` (or any name)
   - **Database Password:** choose a strong password and save it
   - **Region:** choose the closest region to your users
4. Click **"Create new project"** and wait ~1 minute for it to provision

#### 1.2 Get Your API Keys
1. In your Supabase project, click **"Project Settings"** (gear icon, bottom left)
2. Click **"API"** in the left sidebar
3. Copy these two values — you'll need them later:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 1.3 Create the Database Table

1. Go to **SQL Editor** (left sidebar icon that looks like `</>`)
2. Click **"+ New Query"**
3. Paste and run the following SQL:

```sql
-- Create the tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  title         text NOT NULL,
  description   text,
  energy_level  text NOT NULL DEFAULT 'pending'
                  CHECK (energy_level IN ('deep', 'shallow', 'zombie', 'pending')),
  status        text NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo', 'done')),
  user_id       uuid NOT NULL DEFAULT auth.uid()
                  REFERENCES auth.users(id) ON DELETE CASCADE,
  deadline      timestamptz,
  completed_at  timestamptz
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop any old/demo policies
DROP POLICY IF EXISTS "Enable all access for demo" ON public.tasks;
DROP POLICY IF EXISTS "Users can only see and manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Strict Read Isolation" ON public.tasks;
DROP POLICY IF EXISTS "Strict Insert Isolation" ON public.tasks;
DROP POLICY IF EXISTS "Strict Update Isolation" ON public.tasks;
DROP POLICY IF EXISTS "Strict Delete Isolation" ON public.tasks;

-- Create strict per-user isolation policies
CREATE POLICY "Strict Read Isolation" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Strict Insert Isolation" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Strict Update Isolation" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Strict Delete Isolation" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);
```

4. Click **"Run"** — you should see `Success. No rows returned.`

> ⚠️ **Important:** If you already have an existing `tasks` table, run `DROP TABLE public.tasks;` first, then run the script above.

#### 1.4 Configure Authentication — Email/Password

1. Go to **Authentication** → **Providers** (left sidebar)
2. Make sure **Email** is enabled (it is by default)
3. Optionally: disable **"Confirm email"** during development so you can register without email verification

#### 1.5 Configure Authentication — Google OAuth

1. **Create Google OAuth credentials:**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project (or select existing)
   - Go to **APIs & Services** → **Credentials**
   - Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
   - Application type: **Web application**
   - Under **Authorized redirect URIs**, add:
     ```
     https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
     ```
     *(Find your project ref in Supabase → Project Settings → General)*
   - Click **Create** and copy the **Client ID** and **Client Secret**

2. **Add credentials to Supabase:**
   - Go to **Authentication** → **Providers** → **Google**
   - Toggle **Enable** on
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

3. **Add your site URL:**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to:
     - For Vercel: `https://your-app.vercel.app`
     - For local dev: `http://localhost:3000`
   - Under **Redirect URLs**, add both:
     ```
     http://localhost:3000/auth/callback
     https://your-app.vercel.app/auth/callback
     ```

---

### Part 2 — Google AI API Key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** → **"Create API key in new project"**
4. Copy the generated key — this is your `GOOGLE_GENERATIVE_AI_API_KEY`

> The free tier gives you ample quota for personal use. The app uses `gemini-1.5-flash` which has generous free limits.

---

### Part 3 — Deploy to Vercel

#### 3.1 Push to GitHub
```bash
git add -A
git commit -m "initial commit"
git push origin main
```

#### 3.2 Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and sign in
2. Click **"Import Git Repository"**
3. Find and select your `shigoto` repository
4. Vercel auto-detects Next.js — **no framework config needed**

#### 3.3 Add Environment Variables

Before clicking Deploy, scroll down to **"Environment Variables"** and add all three:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Google AI Studio API key |

#### 3.4 Deploy
1. Click **"Deploy"**
2. Wait ~2 minutes for the build to complete
3. Vercel will give you a URL like `https://shigoto-xxx.vercel.app`

#### 3.5 Update Supabase Redirect URLs
After you have your Vercel URL:
1. Go back to **Supabase** → **Authentication** → **URL Configuration**
2. Update **Site URL** to your Vercel URL
3. Make sure your Vercel URL is in the **Redirect URLs** list:
   ```
   https://your-app.vercel.app/auth/callback
   ```
4. Also update your Google Cloud Console **Authorized redirect URIs** if you're using Google OAuth

---

### Part 4 — Verify Everything Works

1. Visit your deployed app
2. Register a new account with email/password **or** click "Continue with Google"
3. Create a task — it should appear in the **Zombie Mode** column by default
4. Click **"AI Prioritize"** — the AI will categorise your tasks based on deadlines
5. Sign out, register a second account → confirm the board is empty (data isolation working)

---

## 🔒 Security Notes

- All task data is isolated per-user using PostgreSQL **Row Level Security (RLS)**
- The server-side `/api/tasks` route validates the session on every request using HTTP cookies
- `user_id` is always stamped server-side — client cannot spoof ownership
- Never expose your `GOOGLE_GENERATIVE_AI_API_KEY` or Supabase `service_role` key publicly

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| Tasks from another account are visible | Run the RLS SQL from Step 1.3, make sure "Enable all access for demo" policy is deleted |
| Google OAuth redirect fails | Ensure `/auth/callback` is listed in both Supabase Redirect URLs and Google Console |
| AI Prioritize shows infinite loading | Check that `GOOGLE_GENERATIVE_AI_API_KEY` is set in Vercel environment variables |
| 401 errors in the console | Your Supabase session cookie expired — log out and log back in |
| Email confirmation link goes to wrong URL | Set the correct Site URL in Supabase → Authentication → URL Configuration |

---

## 📝 License

MIT — feel free to fork and build on top of this.
