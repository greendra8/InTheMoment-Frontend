import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PRIVATE_SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_ROLE_KEY
);

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

// Helper function to get user's meditations
export async function getUserMeditations(userId: string, page: number = 1, limit: number = 10) {
  const start = (page - 1) * limit
  const end = start + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('audio_sessions')
    .select('*, lesson_playlists(playlist_name)', { count: 'exact' })
    .eq('user_id', userId)
    .eq('generation_status', 'Completed')
    .range(start, end)
    .order('created_at', { ascending: false })

  if (error) throw error;
  return { data, totalCount: count };
}

// Helper function to get a single meditation
export async function getMeditation(meditationId: string) {
  const { data, error } = await supabaseAdmin
    .from('audio_sessions')
    .select('*, lesson_playlists(playlist_name)')
    .eq('id', meditationId)
    .single()

  if (error) throw error;

  try {
    let signedAudioUrl = data.signed_audio_url;
    let urlExpiration = data.url_expiration;

    // Check if we need to generate a new signed URL
    if (!signedAudioUrl || !urlExpiration || new Date(urlExpiration) < new Date(Date.now() + 10 * 60 * 1000)) {
      // Generate new signed URL
      signedAudioUrl = await getSignedUrl(data.file_path);
      urlExpiration = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      // Update the database with the new URL and expiration
      await supabaseAdmin
        .from('audio_sessions')
        .update({ signed_audio_url: signedAudioUrl, url_expiration: urlExpiration })
        .eq('id', meditationId);
    }

    return { ...data, signedAudioUrl, urlExpiration };
  } catch (signedUrlError) {
    console.error('Error generating signed URL:', signedUrlError);
    throw signedUrlError;
  }
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

// Helper function to get playlists with visibility handling
export async function getPlaylists(includeHidden: boolean = false) {
  try {
    let query = supabaseAdmin
      .from('lesson_playlists')
      .select('id, playlist_name, playlist_order, playlist_description, visible')
      .order('playlist_order');

    if (!includeHidden) {
      query = query.eq('visible', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching playlists:', err);
    throw err;
  }
}

// Helper function to get a single playlist with visibility handling
export async function getPlaylist(playlistId: string, includeHidden: boolean = false) {
  try {
    let query = supabaseAdmin
      .from('lesson_playlists')
      .select('id, playlist_name, playlist_description, visible')
      .eq('id', playlistId);

    if (!includeHidden) {
      query = query.eq('visible', true);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching playlist:', err);
    throw err;
  }
}

// Helper function to get lessons for a playlist with visibility handling
export async function getPlaylistLessons(playlistId: string, userId: string | null = null, includeHidden: boolean = false) {
  try {
    let query = supabaseAdmin
      .from('lesson_content')
      .select(`
        id, 
        lesson_number, 
        lesson_title,
        visible,
        audio_sessions (
          id
        )
      `)
      .eq('playlist_id', playlistId)
      .order('lesson_number');

    if (!includeHidden) {
      query = query.eq('visible', true);
    }

    if (userId) {
      query = query
        .eq('audio_sessions.user_id', userId)
        .eq('audio_sessions.generation_status', 'Completed');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process lessons to include meditation info if userId was provided
    const processedLessons = data.map(lesson => ({
      ...lesson,
      meditationId: lesson.audio_sessions?.[0]?.id || null
    }));

    return processedLessons;
  } catch (err) {
    console.error('Error fetching playlist lessons:', err);
    throw err;
  }
}

// Add this new function to generate a signed URL
async function getSignedUrl(filePath: string) {
  console.log('Generating signed URL for file path:', filePath);
  const { data, error } = await supabaseAdmin
    .storage
    .from('meditation_audios')
    .createSignedUrl(filePath, 5400) // URL valid for 90 minutes

  if (error) {
    console.error('Error in getSignedUrl:', error);
    throw error;
  }
  return data.signedUrl;
}

export async function getFeedback(sessionId: string, profileId: string) {
  const { data, error } = await supabaseAdmin
    .from('audio_feedback')
    .select('feedback')
    .eq('session_id', sessionId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching feedback:', error);
    throw error;
  }
  return data?.feedback || null;
}



