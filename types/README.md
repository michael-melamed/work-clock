# types/

## Purpose
Global TypeScript type definitions and interfaces shared across the entire codebase.
Single source of truth for all domain types.

## What Goes Here

| File | Description |
|---|---|
| `database.types.ts` | Auto-generated Supabase DB types (from `supabase gen types typescript`) |
| `session.types.ts` | Work session domain types (`WorkSession`, `ClockEvent`, etc.) |
| `user.types.ts` | User profile types (`UserProfile`, `UserSettings`) |
| `api.types.ts` | API request/response types |
| `index.ts` | Barrel export for all types |

## Key Rules
- **No `any`** — always define precise types
- Use `interface` for object shapes, `type` for unions and aliases
- Database types from `database.types.ts` are the ground truth — derive app types from them
- Keep types pure — no runtime logic, no imports from React

## Generating DB Types

Once Supabase is configured, run:
```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
```

## Dependencies
- None — types are pure TypeScript declarations
