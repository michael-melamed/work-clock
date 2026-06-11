# app/(auth)/login/

## Purpose
The main authentication entry point for the application. This is a public route not protected by the session middleware.

## Files
- `page.tsx`: Renders the login UI. It is a Client Component since it handles user interactions (button clicks) and uses the browser Supabase client to trigger the OAuth flow.

## Logic
We use `supabase.auth.signInWithOAuth({ provider: 'google' })`.
The redirect URL points to `/auth/callback`, which is handled by a Route Handler to exchange the code for a secure HTTP-only cookie session.
