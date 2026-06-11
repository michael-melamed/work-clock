# app/api/

## Purpose
Next.js Route Handlers (API endpoints) that run on the server.
Used for any operation that must not be exposed to the client, or requires server-side logic.

## What Goes Here

| Endpoint | File | Description |
|---|---|---|
| `POST /api/clock/in` | `clock/in/route.ts` | Record a clock-in event |
| `POST /api/clock/out` | `clock/out/route.ts` | Record a clock-out event |
| `GET /api/sessions` | `sessions/route.ts` | Fetch work sessions for the current user |

## Key Notes
- All route handlers verify the session with `createRouteHandlerClient` before processing
- **No business logic in route files** — call service functions from `lib/`
- Return proper HTTP status codes (`200`, `401`, `400`, `500`)
- Use `NextResponse.json()` for all responses

## Dependencies
- `@supabase/auth-helpers-nextjs` — `createRouteHandlerClient`
- `next/server` — `NextRequest`, `NextResponse`
