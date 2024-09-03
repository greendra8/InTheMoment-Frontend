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
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error;
  return data;
}

// Helper function to update user profile
export async function updateUserProfile(userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to get user's meditations
export async function getUserMeditations(userId: string, page: number = 1, limit: number = 10) {
  const start = (page - 1) * limit
  const end = start + limit - 1

  const { data, error } = await supabaseAdmin
    .from('meditations')
    .select('*')
    .eq('user_id', userId)
    .range(start, end)
    .order('created_at', { ascending: false })
  
  if (error) throw error;
  return data;
}

// Helper function to get a single meditation
export async function getMeditation(meditationId: string) {
  const { data, error } = await supabaseAdmin
    .from('meditations')
    .select(`
      *,
      audio_files (
        file_path
      )
    `)
    .eq('id', meditationId)
    .single()
  
  if (error) throw error;
  return data;
}

// Helper function to check meditation status
export async function getMeditationStatus(meditationId: string) {
  const { data, error } = await supabaseAdmin
    .from('meditations')
    .select('status')
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
  const { data, error } = await supabaseAdmin
    .from('meditation_completions')
    .insert({ meditation_id: meditationId, user_id: userId, minutes_completed: minutesCompleted })
  
  if (error) throw error
  return data
}