# components/ui/

## Purpose
Generic, reusable UI primitives with **no business logic and no data fetching**.
These components know nothing about work clocks, sessions, or Supabase.

## What Goes Here

| Component | Description |
|---|---|
| `Button.tsx` | Styled button with variants (primary, secondary, ghost) |
| `Card.tsx` | Container card with shadow and padding |
| `Badge.tsx` | Status indicator pill |
| `Spinner.tsx` | Loading spinner |
| `Avatar.tsx` | User avatar with fallback initials |
| `index.ts` | Barrel export for all UI components |

## Key Rules
- Props-only — no internal state that changes data
- Accessible — use proper ARIA attributes
- Styled with Tailwind CSS only
- Must be exportable and usable in any context

## Dependencies
- `react` — component model
- `tailwindcss` — styling
