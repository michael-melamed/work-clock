# app/(app)/

## Purpose
Protected route group for all authenticated app pages.
Every route here **requires a valid session** — enforced by `middleware.ts`.

## What Goes Here

| Route | File | Description |
|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | Main dashboard with today's summary |
| `/history` | `history/page.tsx` | Full work history / time log |
| `/settings` | `settings/page.tsx` | User preferences |

## Key Notes
- The `(app)` group prefix is **not part of the URL** — `/dashboard` not `/(app)/dashboard`
- Each page is a **Server Component** by default — fetch data directly on the server
- Session is checked in `middleware.ts` — no need to repeat auth checks in every page
- This folder may have a shared `layout.tsx` for the app shell (sidebar, header, etc.)

## Dependencies
- `@supabase/auth-helpers-nextjs` — `createServerComponentClient` for server-side data fetching
- `next/navigation` — `redirect()` if session check fails
