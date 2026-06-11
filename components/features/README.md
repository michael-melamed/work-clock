# components/features/

## Purpose
Domain-specific components that are tied to the Work Clock business logic.
These components may use custom hooks or receive domain data as props.

## What Goes Here

| Component | Description |
|---|---|
| `ShiftCard.tsx` | Displays a single completed shift: date, clock-in/out times, duration badge. Pure display component — receives a `CompletedShift` prop. |
| `index.ts` | Barrel export for all feature components |

## Key Rules
- May use hooks from `hooks/` for data and state
- No direct Supabase calls inside components — go through hooks or server actions
- Use `"use client"` only when the component needs browser APIs or React state
- `ShiftCard` is a pure (stateless) presentational component — no hooks inside

## Dependencies
- `types/` — domain types (`CompletedShift` from `hooks/useShift`)
- No Supabase dependency — data arrives via props
