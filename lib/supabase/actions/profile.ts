'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Fetches a user's profile.
 * If the profile does not exist (e.g., if the DB trigger failed or the user is from before the trigger),
 * this function will act as a fallback and create the profile based on the current auth session.
 */
export async function getProfile(userId: string) {
  const supabase = createSupabaseServerClient()
  
  // 1. Attempt to fetch the existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profile) return profile

  // PGRST116 means the row was not found, which is expected if the profile doesn't exist.
  // Any other error means something went genuinely wrong.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
    throw new Error('Failed to fetch profile')
  }

  // 2. Fallback: create the profile
  // To populate the profile correctly, we need the user's email and metadata from auth.users.
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  if (user.id !== userId) {
    throw new Error('Unauthorized: You can only initialize your own profile')
  }

  const newProfile = {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([newProfile])
    .select('*')
    .single()

  if (insertError) {
    console.error('Error creating fallback profile:', insertError)
    throw new Error('Failed to create profile')
  }

  return createdProfile
}
