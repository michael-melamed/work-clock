# app/(auth)/

## Purpose
Unauthenticated route group for all auth-related pages.
These routes are **publicly accessible** — no session required.

## What Goes Here

| Route | File | Description |
|---|---|---|
| `/login` | `login/page.tsx` | Google OAuth sign-in page |
| `/auth/callback` | `auth/callback/route.ts` | OAuth callback handler (exchanges code for session) |

## Key Notes
- The `(auth)` group prefix is **not part of the URL** — `/login` not `/(auth)/login`
- The callback route is a Route Handler (`route.ts`), not a page
- After successful auth, users are redirected to `/dashboard` (inside `(app)/`)

## Dependencies
- `@supabase/auth-helpers-nextjs` — `createRouteHandlerClient` for the callback
- `next/navigation` — `redirect()` after successful sign-in
