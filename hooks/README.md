# hooks/

## Purpose
Custom React hooks that encapsulate client-side API calls and state management logic.
UI components stay thin and declarative, while hooks own the complexity of interacting with the `/api` routes.

## What Goes Here

| Hook | Description |
|---|---|
| `useShift.ts` | Manages the active shift lifecycle. Exposes `clockIn`, `clockOut`, `refresh`, and current state (`isActive`, `currentShift`, etc.). Calls the status API on mount. |
| `useHistory.ts` | Fetches completed shift history from the API and supports pagination limits. Calls history API on mount. |
| `index.ts` | Barrel export for easy importing (`import { useShift } from '@/hooks'`). |

## Key Rules
- **Explicit Returns:** State interfaces must be clearly typed.
- **Manage Loading/Error State:** Hooks with async operations must expose `isLoading` (and/or `isSubmitting`) and `error`.
- **Auto-fetch:** Data-fetching hooks automatically call their endpoints on component mount.
- **Client Components Only:** These hooks use React state and effects (`useState`, `useEffect`) and should only be used in `'use client'` files.
