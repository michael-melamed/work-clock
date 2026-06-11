# Project State

## Current Stage
**12 History Advanced Features Completed** (daily/monthly totals, shift editing and deletion)

---

## ✅ What's Done

- Next.js 14 project created with App Router
- TypeScript and Tailwind CSS configured
- Supabase packages installed
- Full folder structure created with README.md in each folder
- `.env.local.example` created
- **Supabase Clients** — `client.ts`, `server.ts`, `middleware.ts`
- **Root middleware** — session refresh + route protection
- `lib/supabase/README.md` updated with correct usage examples
- **Database Migrations:** 
  - `001_initial_schema.sql` (profiles, shifts, RLS)
  - `002_auto_profile.sql` (handle_new_user function and trigger)
  - `003_shift_delete_policy.sql` (shift deletion RLS policy)
- **Auth Flow** - Google OAuth login page and callback route with fix for browser cookies
- **Server Actions** - `getProfile(userId)` with fallback creation
- **API Types** - `types/api.ts` with standard `ApiResponse<T>`
- **Shift API** - `clock-in`, `clock-out`, `status`, `history` GET/POST endpoints completed.
- **Dynamic API** - `PATCH` / `DELETE` /api/shifts/[id] endpoints for shift editing and deletion.
- **Client Hooks** - `useShift.ts` and `useHistory.ts` updated to manage and mutate React states dynamically.
- **Dashboard UI** - `app/(app)/page.tsx` built with large clock, active shift logic, user greeting, sign out button, and responsive UI.
- **History UI** - `app/(app)/history/page.tsx` built with `ShiftCard` component, daily totals, monthly totals banner, and edit/delete modal.
- **Rendering Configuration** - Configured `export const dynamic = 'force-dynamic'` on history and status GET APIs.

---

## 📁 Critical Files

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout (fonts, global CSS) |
| `app/(app)/page.tsx` | Main Dashboard screen (Clock-in/out UI, Sign Out, User greeting) |
| `app/(app)/history/page.tsx` | Shift history page with daily/monthly totals and edit modal |
| `components/features/ShiftCard.tsx` | Displays a single shift card with onEdit button |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client |
| `middleware.ts` | Edge middleware — session refresh + route protection |
| `supabase/migrations/001_initial_schema.sql` | SQL schema for `profiles` and `shifts` |
| `supabase/migrations/002_auto_profile.sql` | SQL for user creation trigger |
| `supabase/migrations/003_shift_delete_policy.sql` | SQL for shift deletion RLS policy |
| `app/(auth)/login/page.tsx` | Login UI and OAuth trigger |
| `app/auth/callback/route.ts` | OAuth session exchange handler |
| `lib/supabase/actions/profile.ts` | `getProfile(userId)` server action |
| `types/api.ts` | Standardized `ApiResponse<T>` interface |
| `app/api/shifts/*/route.ts` | The 4 shift-related API route handlers |
| `app/api/shifts/[id]/route.ts` | Dynamic PATCH/DELETE shift endpoint |
| `hooks/useShift.ts` | UI state manager for active shift operations |
| `hooks/useHistory.ts` | UI state manager for shift history list, including update/delete functions |

---

## 🔜 What's Next

**Deploy & Validate App:**
- Ensure the app is deployed on Vercel.
- Validate PWA features in production.

---

## 🗒️ Decisions Made

- Google OAuth configured in Supabase Dashboard only — no client IDs in code
- `@supabase/auth-helpers-nextjs` kept (deprecated but functional for this project)
- Protected routes: `/` and `/history/:path*`
- Middleware preserves original destination in `?next=` param for post-login redirect
- Created `profiles` table to extend `auth.users` with trigger-based `updated_at`.
- `shifts` table holds the core domain logic, utilizing `clock_out` as a nullable field for ongoing shifts.
- Auth callback redirects to `/` on success, and `/login?error=auth_failed` on failure.
- Force dynamic rendering on status and history GET routes to prevent route caching in Next.js builds.
- Adjusted PWA Service Worker caching strategy: Changed page navigations to Network-first (uncached) to prevent caching of auth redirect states.
