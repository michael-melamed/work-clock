# components/

## Purpose
All React components for the application.
Split into two sub-folders: `ui/` for generic primitives and `features/` for domain-specific components.

## Structure

```
components/
├── ui/          ← Generic, reusable UI primitives (no business logic)
└── features/    ← Domain-specific feature components (may use hooks/data)
```

## Key Rules
- **No business logic in components** — logic lives in hooks (`hooks/`) or server actions
- Components that need React state or browser APIs must have `"use client"` at the top
- Export all components from `index.ts` within each sub-folder

## Dependencies
- `react` — component model
- `tailwindcss` — styling
