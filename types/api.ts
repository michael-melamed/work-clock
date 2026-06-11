/**
 * Standardized API response format for all route handlers.
 */
export type ApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
}
