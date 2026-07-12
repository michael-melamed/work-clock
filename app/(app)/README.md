# app/(app)/

## Purpose
Protected route group for all authenticated app pages.
Every route here **requires a valid session** — enforced by `middleware.ts`.

All pages inside this group share a dark premium visual aesthetic, styled with responsive glassmorphism panels.

## What Goes Here

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Main dashboard (Active shift tracker, tactile clock button, haptic feedback, bottom sheet summary) |
| `/history` | `history/page.tsx` | Full work history / time log with daily/monthly totals and edit modal |
| `/settings` | `settings/page.tsx` | User preferences |

## Key Notes
- The `(app)` group prefix is **not part of the URL** — `/history` not `/(app)/history`
- **Premium UX Features implemented:**
  - **Haptic Feedback:** The main button triggers standard physical vibrations (`navigator.vibrate`) on mobile devices.
  - **Dynamic Title Tracking:** The browser tab title updates dynamically with the active shift timer (e.g. `[01:23:45] - WorkClock`).
  - **Slide-up Summary (Bottom Sheet):** A native-feeling bottom sheet slides up on clock out, allowing immediate feedback and quick navigation to editing.
  - **Floating Navigation Bar:** A floating glass-capsule navigation bar sits at the bottom of the screen to route between the Dashboard and History smoothly.
- Session is checked in `middleware.ts` — no need to repeat auth checks in every page.

## Dependencies
- `@supabase/auth-helpers-nextjs` — `createServerComponentClient` for server-side data fetching
- `next/navigation` — `redirect()` if session check fails
- `hooks/useShift.ts` — Client-side active shift logic
- `hooks/useHistory.ts` — Client-side history mutations

