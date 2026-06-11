# supabase/

## Purpose
Contains Supabase-related configurations, specifically database migrations. This directory is typically used with the Supabase CLI.

## Database Schema

The database currently consists of two main tables:

### 1. `profiles`
Stores extended user information, linked 1-to-1 with Supabase's internal `auth.users` table.
- `id` (uuid, primary key) - Matches `auth.users.id`.
- `email` (text)
- `full_name` (text, optional)
- `avatar_url` (text, optional)
- `created_at` / `updated_at` (timestamptz)

**RLS Policies:**
- Users can view their own profile.
- Users can update their own profile.

### 2. `shifts`
Stores the work hour tracking entries for users.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> profiles.id)
- `clock_in` (timestamptz) - Start time of the shift.
- `clock_out` (timestamptz, optional) - End time of the shift. If null, the shift is currently active.
- `duration_minutes` (integer, optional) - Calculated total minutes once clocked out.
- `notes` (text, optional)
- `created_at` (timestamptz)

**RLS Policies:**
- Users can view their own shifts.
- Users can insert their own shifts.
- Users can update their own shifts.

## Indexes
- `idx_shifts_user_id_clock_in`: Index on `shifts(user_id, clock_in DESC)` to optimize querying a user's recent shifts or identifying their active shift.

## Triggers
- `update_profiles_updated_at`: Automatically sets `updated_at` to `now()` when a profile row is updated.
