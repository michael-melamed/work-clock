# lib/supabase/

## Purpose
Supabase client instances configured for the three distinct Next.js rendering contexts.
**Always import the right client for the right context — mixing them causes session bugs.**

---

## Files

| File | Context | When to use |
|---|---|---|
| `client.ts` | Browser (Client Components) | Any `'use client'` component that needs to query Supabase or subscribe to realtime |
| `server.ts` | Server Components & Route Handlers | `async` server components, `app/api/` route handlers — has access to `next/headers` |
| `middleware.ts` | `middleware.ts` root file only | Session refresh on every request; never import directly into components |
| `index.ts` | Barrel export | Import all clients from here (`@/lib/supabase`) |

| `actions/` | Server Actions (`'use server'`) | Reusable server-side functions (like `getProfile`) for data fetching/mutations |

---

## Client vs Server — Key Differences

| | Browser client (`client.ts`) | Server client (`server.ts`) |
|---|---|---|
| **Where it runs** | In the user's browser | On the Next.js server (Node.js / Edge) |
| **How it gets the session** | Reads the `sb-*` cookie from `document.cookie` | Reads the cookie via `next/headers → cookies()` |
| **When to use** | `'use client'` components, browser event handlers | Server Components, Route Handlers, Server Actions |
| **Can use service role key?** | ❌ Never — exposed to the public | ✅ Yes — but only for admin operations |
| **Realtime subscriptions** | ✅ Yes | ❌ No — server has no persistent connection |

---

## ⚠️ Critical Rules

- **Never use `server.ts` in a Client Component** — `next/headers` throws at runtime
- **Never use `client.ts` in a Server Component** — it won't have the session cookie from the request
- **Don't use the Barrel Export for specific clients** — to avoid importing server dependencies into the client bundle, import directly from the specific file.
- **`SUPABASE_SERVICE_ROLE_KEY` is for admin operations only** — bypasses all Row Level Security
- **Always `await supabase.auth.getSession()`** in server contexts before trusting any query result
- **The middleware client must receive the same `res` object** that will be returned — otherwise the refreshed cookie is lost

---

## Usage Examples

```ts
// ✅ Client Component
'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
const supabase = createSupabaseBrowserClient()

// ✅ Server Component / Route Handler / Server Action
import { createSupabaseServerClient } from '@/lib/supabase/server'
const supabase = createSupabaseServerClient()
const { data: { session } } = await supabase.auth.getSession()

// ✅ middleware.ts (root)
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
const { supabase, response } = createSupabaseMiddlewareClient(req)
await supabase.auth.getSession() // refreshes token
return response
```

---

## Dependencies
- `@supabase/supabase-js` — `SupabaseClient` type, `Database` generic
- `@supabase/auth-helpers-nextjs` — `createClientComponentClient`, `createServerComponentClient`, `createMiddlewareClient`
- `next/headers` — `cookies()` used by server client only
