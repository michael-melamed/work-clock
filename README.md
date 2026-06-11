# Work Clock ⏱️

A Progressive Web App (PWA) for tracking work hours.

**Stack:** Next.js 14 (App Router) · Supabase · Google OAuth · Tailwind CSS  
**Deployment:** Vercel

---

## 📁 Folder Map

```
work-clock/
├── README.md                  ← You are here — main project map
├── state.md                   ← Current project state (updated after every task)
├── .env.local                 ← Environment variables (not in git)
├── .env.local.example         ← Template for required env vars
├── app/
│   ├── README.md              ← App Router overview
│   ├── (auth)/                ← Auth routes (login, callback)
│   │   └── README.md
│   ├── (app)/                 ← Protected app routes (dashboard, etc.)
│   │   └── README.md
│   └── api/                   ← API route handlers
│       └── README.md
├── components/
│   ├── README.md              ← Components overview
│   ├── ui/                    ← Generic, reusable UI primitives
│   └── features/              ← Domain-specific feature components
├── lib/
│   ├── README.md              ← Shared utilities overview
│   └── supabase/              ← Supabase client instances & helpers
│       └── README.md
├── hooks/                     ← Custom React hooks
│   └── README.md
└── types/                     ← Global TypeScript types & interfaces
    └── README.md
```

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <repo-url>
cd work-clock
npm install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Supabase project credentials.

### 3. Configure Google OAuth

Google OAuth is configured **directly in the Supabase Dashboard** → Authentication → Providers → Google.  
No `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are needed in code.

Set the redirect URL in Supabase to:
```
https://<your-domain>/auth/callback
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key — **never expose to client** |
| `NEXT_PUBLIC_APP_URL` | App URL (for OAuth redirect) |

---

## 📐 Architecture Decisions

- **App Router** — all routes use the Next.js 14 App Router
- **Server Components by default** — client components are opt-in with `"use client"`
- **No business logic in components** — logic lives in hooks or server actions
- **TypeScript strict mode** — no `any` allowed
- **Route protection** — every protected route verifies session server-side
