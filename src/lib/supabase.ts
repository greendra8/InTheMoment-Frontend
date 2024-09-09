import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const PRIVATE_SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseAdmin = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error;
  return data;
}

// Helper function to update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()

  if (error) throw error
  return data[0]
}

// Helper function to get user's meditations
export async function getUserMeditations(userId: string, page: number = 1, limit: number = 10) {
  const start = (page - 1) * limit
  const end = start + limit - 1

  const { data, error } = await supabaseAdmin
    .from('mindfulness_meditations')
    .select('*')
    .eq('user_id', userId)
    .neq('generation_status', 'failed')
    .range(start, end)
    .order('created_at', { ascending: false })
  
  if (error) throw error;
  return data;
}

// Helper function to get a single meditation
export async function getMeditation(meditationId: string) {
  const { data, error } = await supabaseAdmin
    .from('mindfulness_meditations')
    .select('*')
    .eq('id', meditationId)
    .single()
  
  if (error) throw error;
  return data;
}

// Helper function to check meditation status
export async function getMeditationStatus(meditationId: string) {
  const { data, error } = await supabaseAdmin
    .from('mindfulness_meditations')
    .select('generation_status')
    .eq('id', meditationId)
    .single();

  if (error) {
    console.error('Error in getMeditationStatus:', error);
    throw error;
  }

  return data;
}

// Helper function to mark a meditation as complete
export async function completeMeditation(meditationId: string, userId: string, minutesCompleted: number) {
  // Check if the meditation was last listened to within the last 12 hours
  const { data: meditationData, error: meditationError } = await supabaseAdmin
    .from('mindfulness_meditations')
    .select('last_listened')
    .eq('id', meditationId)
    .single()

  if (meditationError) throw meditationError

  const lastListened = meditationData.last_listened ? new Date(meditationData.last_listened) : null
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)

  if (lastListened && lastListened > twelveHoursAgo) {
    // Meditation was listened to within the last 12 hours, don't update user's total time
    console.log('Meditation was listened to recently. Not updating total time.')
    return
  }

  // Meditation was not listened to within the last 12 hours or never listened to, update user's total time
  const { data: userData, error: userError } = await supabaseAdmin
    .from('profiles')
    .select('minutes_listened')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const updatedMinutes = (userData.minutes_listened || 0) + minutesCompleted

  const { error: updateUserError } = await supabaseAdmin
    .from('profiles')
    .update({ minutes_listened: updatedMinutes })
    .eq('id', userId)

  if (updateUserError) throw updateUserError

  // Update last_listened timestamp and listened status for the meditation
  const { error: updateMeditationError } = await supabaseAdmin
    .from('mindfulness_meditations')
    .update({ 
      last_listened: new Date().toISOString(),
      listened: true
    })
    .eq('id', meditationId)

  if (updateMeditationError) throw updateMeditationError

  console.log('Meditation completed and user total time updated successfully.')
}

// Helper function to check if user profile is completed
export async function isUserProfileComplete(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('complete')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error checking user profile completion:', error)
    throw error
  }
  
  return data?.complete || false
}

// Helper function to submit user context
export async function submitUserContext(userId: string, profileData: any) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      name: profileData.name,
      dob: profileData.dob,
      gender: profileData.gender,
      preferences: profileData.preferences,
      complete: true,
      experience: profileData.experience
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}