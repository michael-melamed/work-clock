# lib/

## Purpose
Shared utilities and service helpers used across the application.
Nothing here is React-specific — these are pure functions and configured clients.

## Structure

```
lib/
└── supabase/     ← Supabase client instances for different contexts
```

## What May Also Go Here

| File | Description |
|---|---|
| `utils.ts` | Generic helpers (date formatting, duration calculation, etc.) |
| `validators.ts` | Input validation functions |
| `constants.ts` | App-wide constants |

## Key Rules
- No React imports — this is framework-agnostic logic
- No UI side effects
- Every function must have a clear return type (TypeScript strict)
- Async functions must handle errors with try/catch

## Dependencies
- `@supabase/supabase-js` — base Supabase client
- `@supabase/auth-helpers-nextjs` — context-specific client factories
