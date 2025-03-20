import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { getSessionRecommendationPrompt, getFeedbackConversationPrompt } from '../ai/prompts';

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
export async function getUserMeditations(
  userId: string,
  page: number = 1,
  limit: number = 10,
  contentType?: 'meditation' | 'hypnosis'
) {
  const start = (page - 1) * limit
  const end = start + limit - 1

  let query = supabaseAdmin
    .from('audio_sessions')
    .select('*, lesson_playlists(playlist_name)', { count: 'exact' })
    .eq('user_id', userId)
    .eq('generation_status', 'Completed')

  // Apply content type filter if specified
  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  const { data, error, count } = await query
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
          id,
          generation_status
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
      meditationId: lesson.audio_sessions?.[0]?.id || null,
      hasGenerated: lesson.audio_sessions?.some(session => session.generation_status === 'Completed') || false
    }));

    return processedLessons;
  } catch (err) {
    console.error('Error fetching playlist lessons:', err);
    throw err;
  }
}

// Helper function to get user progress for a playlist
export async function getUserProgress(userId: string, playlistId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .select('completed_lessons')
    .eq('user_id', userId)
    .eq('playlist_id', playlistId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user progress:', error);
    throw error;
  }

  return data?.completed_lessons || [];
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

// Server-side implementation for audio transcription
export async function serverTranscribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Check audio duration using buffer size as a rough estimate
    // WebM audio at typical quality is roughly 20-30KB per second
    // 2 minutes = 120 seconds, so ~2.4-3.6MB
    // We'll use a slightly higher limit (2 minutes 5 seconds) = 125 seconds = ~3.75MB
    const MAX_AUDIO_SIZE = 3.75 * 1024 * 1024; // 3.75MB (approx 2 minutes 5 seconds)

    if (audioBuffer.length > MAX_AUDIO_SIZE) {
      console.warn(`Audio exceeds maximum allowed duration. Size: ${audioBuffer.length} bytes, Max: ${MAX_AUDIO_SIZE} bytes`);
      throw new Error('Audio recording exceeds the maximum allowed duration of 2 minutes');
    }

    // const formData = new FormData();
    // const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    // formData.append('file', blob);
    // formData.append('model', 'openai/whisper-large-v3');
    // formData.append('language', 'en');

    // const response = await fetch('https://api.deepinfra.com/v1/openai/audio/transcriptions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${import.meta.env.VITE_DEEPINFRA_API_KEY}`
    //   },
    //   body: formData
    // });

    const formData = new FormData();

    // Create a Blob with the correct MIME type that Groq accepts
    // Explicitly use 'audio/webm' which is in the list of accepted formats
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });

    // Generate a filename with extension to help the API identify the format
    const fileName = `recording-${Date.now()}.webm`;

    // Append as a File object with filename to ensure proper format detection
    const file = new File([blob], fileName, { type: 'audio/webm' });
    formData.append('file', file);

    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');

    console.log(`Sending transcription request with file: ${fileName}, size: ${audioBuffer.length} bytes`);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: formData
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription API error:', errorText);
      throw new Error(`Failed to transcribe audio: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in serverTranscribeAudio:', error);
    throw error;
  }
}

// Unified AI conversation handler for both session recommendations and feedback
export async function serverHandleAIConversation(
  messages: Array<{ role: string, content: string }>,
  mode: 'session-recommendation' | 'feedback-conversation',
  options?: {
    localTime?: string,
    sessionId?: string
  }
) {
  try {
    // Get system prompt based on mode
    let systemPrompt: string;

    if (mode === 'session-recommendation') {
      if (!options?.localTime) {
        throw new Error('localTime is required for session recommendations');
      }

      // Enforce character limit on the last user message if it exists
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user' && lastMessage.content.length > 500) {
          // Truncate to 500 characters
          lastMessage.content = lastMessage.content.substring(0, 500);
          console.log('Truncated user message to 500 characters');
        }
      }

      systemPrompt = getSessionRecommendationPrompt(options.localTime);
    }
    else if (mode === 'feedback-conversation') {
      // Get session details for context (optional)
      let sessionInfo = null;
      if (options?.sessionId) {
        try {
          sessionInfo = await getMeditation(options.sessionId);
        } catch (error) {
          console.error('Error fetching session info:', error);
          // We'll continue even if this fails
        }
      }

      systemPrompt = getFeedbackConversationPrompt(sessionInfo);
    }
    else {
      throw new Error(`Unsupported conversation mode: ${mode}`);
    }

    // Convert messages to Gemini format
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      }
    ];

    // Add user messages
    for (const message of messages) {
      contents.push({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      });
    }

    // Call Gemini API for both types of conversations
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Gemini API error (${mode}):`, errorText);
      throw new Error(`Failed to process ${mode}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(`Error in serverHandleAIConversation (${mode}):`, error);
    throw error;
  }
}



