# app/api/shifts/

## Purpose
API endpoints for managing user shift tracking (clock in, clock out, shift history, and status).

## Endpoints

### `POST /api/shifts/clock-in`
Starts a new shift for the authenticated user.
- **Auth:** Required (`401 Unauthorized` if missing)
- **Validation:** Checks if the user already has an active shift (`clock_out IS NULL`). Returns `400 Bad Request` if true.
- **Success:** Creates a new record in `shifts` and returns `201 Created`.

### `POST /api/shifts/clock-out`
Ends the currently active shift for the user.
- **Auth:** Required
- **Validation:** Requires an active shift to exist. Returns `400 Bad Request` if there is no active shift.
- **Success:** Updates the `clock_out` and calculates `duration_minutes`. Returns `200 OK` with the updated record and a dynamically formatted `duration_formatted` string.

### `GET /api/shifts/status`
Checks if the authenticated user has an active shift.
- **Auth:** Required
- **Rendering:** Dynamic (`export const dynamic = 'force-dynamic'`)
- **Success:** Returns `200 OK` with `{ active: boolean, shift: Shift | null }`.

### `GET /api/shifts/history`
Retrieves past completed shifts for the authenticated user.
- **Auth:** Required
- **Query Params:** `?limit=30` (defaults to 30, must be positive integer)
- **Rendering:** Dynamic (`export const dynamic = 'force-dynamic'`)
- **Success:** Returns `200 OK` with an array of completed shifts (`clock_out IS NOT NULL`), sorted by `clock_in DESC`. Each record includes `id`, `clock_in`, `clock_out`, `duration_minutes`, and a computed `duration_formatted`.

## Global Rules
- **Error Format:** Every response strictly follows the `ApiResponse<T>` interface (`types/api.ts`):
  ```typescript
  {
    data: T | null;
    error: string | null;
  }
  ```
- **Error Handling:** All endpoints must gracefully catch unexpected errors or database unavailability, returning a formatted `500` error rather than crashing.
