# app/

## Purpose
Next.js 14 App Router root. All pages, layouts, and API routes live here.

## Structure

```
app/
├── layout.tsx          ← Root layout (html, body, fonts, global providers)
├── page.tsx            ← Root page (public landing or redirect)
├── globals.css         ← Global CSS styles
├── (auth)/             ← Auth route group (unauthenticated routes)
├── (app)/              ← Protected route group (requires session)
└── api/                ← API route handlers (Next.js Route Handlers)
```

## Key Notes
- Route groups `(auth)` and `(app)` use parentheses so they do NOT appear in the URL path
- All routes inside `(app)/` must be protected — session is verified via `middleware.ts`
- Server Components are the default — use `"use client"` only when necessary

## Dependencies
- `next` — App Router, layouts, pages
- `@supabase/auth-helpers-nextjs` — server-side session helpers
