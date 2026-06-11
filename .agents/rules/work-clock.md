---
trigger: always_on
---

# Agent Rules — Work Clock Project

## Project Identity
A PWA for tracking work hours.
**Stack:** Next.js 14 (App Router) + Supabase + Google OAuth + Tailwind CSS
**Deployment:** Vercel

---

## Iron Rules

### Structure & Documentation
- **Every folder must have a `README.md`** that explains:
  - What the folder contains
  - Key dependencies (main imports/exports)
  - What to know before touching it
- Before writing any code — read the `README.md` of the relevant folder
- After every change — update the `README.md` accordingly

### Work Approach
- **One layer at a time** — do not continue without approval
- **Do not write UI before the API works**
- **Do not write API before the DB schema is defined**
- Every task ends with a checklist that must be verified before moving on

### Token Efficiency
- **At the end of every task** — update `state.md` in the project root with:
  - Current stage (what's done, what's next)
  - Critical files created and their purpose
  - Any decisions made during execution
- **Before modifying an existing file** — read it first. Do not rely on memory from a previous step.

### Code
- TypeScript everywhere — no `any`
- Every async function handles errors (try/catch or Result pattern)
- No business logic inside components — only in hooks or server actions
- Environment variables — only via `.env.local`, never hardcoded
- Every route is protected — verify session before every operation

### Code Style
- Function and variable names in English
- Comments in any language are fine
- Organized exports — `index.ts` in every feature folder

### What's Forbidden
- ❌ Do not delete existing code without asking
- ❌ Do not add new libraries without listing them and getting approval
- ❌ Do not change DB schema without a proper migration
- ❌ Do not modify files unrelated to the current task
- ❌ Do not continue if there's a type error — fix it first

---

## Expected Folder Structure

```
work-clock/
├── README.md                  ← main project map
├── state.md                   ← current project state (updated after every task)
├── .env.local                 ← environment variables (not in git)
├── app/
│   ├── README.md
│   ├── (auth)/
│   │   └── README.md
│   ├── (app)/
│   │   └── README.md
│   └── api/
│       └── README.md
├── components/
│   └── README.md
├── lib/
│   ├── README.md
│   └── supabase/
│       └── README.md
├── hooks/
│   └── README.md
└── types/
    └── README.md
```

---

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=       # Server-side service role key — never exposed to client
NEXT_PUBLIC_APP_URL=             # App URL (for OAuth redirect)
```
Note: Google OAuth is configured directly in the Supabase Dashboard — no GOOGLE_CLIENT_ID/SECRET needed in code.

---

## Task Completion Format

At the end of every task, provide:
1. **What was done** — short list
2. **Files created/modified**
3. **Tests to run** — specific and verifiable
4. **What's next**