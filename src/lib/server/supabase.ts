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

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob);
    formData.append('model', 'openai/whisper-large-v3-turbo');

    const response = await fetch('https://api.deepinfra.com/v1/openai/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPINFRA_API_KEY}`
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

// Server-side implementation for session recommendation
export async function serverGetSessionRecommendation(messages: Array<{ role: string, content: string }>, localTime: string) {
  try {
    // Enforce character limit on the last user message if it exists
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' && lastMessage.content.length > 500) {
        // Truncate to 500 characters
        lastMessage.content = lastMessage.content.substring(0, 500);
        console.log('Truncated user message to 500 characters');
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'HTTP-Referer': import.meta.env.VITE_APP_URL,
        'X-Title': 'InTheMoment.app'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-pro-exp-02-05:free',
        messages: [
          {
            role: 'system',
            content: `You are a mindfulness teacher's assistant helping to configure meditation and hypnosis sessions. Imagine they have just entered the room at ${localTime} and you're looking to gauge their current state and needs.
            Based on the user's responses, you should ask 3-4 relevant follow-up questions to understand their current state and needs.
            
            After gathering sufficient information, decide whether a MEDITATION or HYPNOSIS session would be more beneficial based on their needs:
            
            - Choose MEDITATION for general mindfulness, stress reduction, present moment awareness, or relaxation.
            - Choose HYPNOSIS for specific goals, behavior change, overcoming specific challenges, or deep mental reprogramming.
            
            Then provide a session configuration in JSON format with these fields:
            - sessionType: "meditation" | "hypnosis"
            - length: number (5-45 minutes, must be one of: 5, 10, 15, 20, 25, 30, 35, 40, 45)
            - posture: "sitting" | "lying" | "walking"
            - eyes: "closed" | "open"
            - hypnosisPrompt: string (only required if sessionType is "hypnosis", should be a clear description of what the hypnosis session should focus on)
            
            Show interest in the user's responses, and ask follow-up questions that will help the teacher tailor the session to the user's needs, whilst remaining charming. Do not explicitly ask questions needed for the JSON configuration.

            Example questions:
            - What have you been up to today?
            - What are you going to do after today's session?
            - Have you had a chance to practice mindfulness outside of our sessions?
            - What's been on your mind recently?
            - Are you happy with your progress in our sessions?
            - Any recent issues or stresses you'd like to discuss?
            - Did you try mindfulness or meditation since last time? How was it?
            - Which meditation techniques have been helpful or tough recently?
            - Noticed any changes in yourself or your practice since we began?
            - Anything else to share or requests for today's session?

            Keep your response less than 250 characters.

            Don't ask how long the session should be - this is up to you to decide and they can always override your choice.
            
            Your responses should be either:
            1. A follow-up question (if you need more information)
            2. A final response with a friendly message followed by the JSON configuration in this format:
            
            [Your friendly message here e.g. Great! Here's a session that I think will be perfect for you!]
            
            \`\`\`json
            {
              "sessionType": "meditation",
              "length": 15,
              "posture": "sitting",
              "eyes": "closed"
            }
            \`\`\`
            
            OR for hypnosis:
            
            \`\`\`json
            {
              "sessionType": "hypnosis",
              "length": 20,
              "posture": "lying",
              "eyes": "closed",
              "hypnosisPrompt": "Overcome anxiety and build confidence in social situations"
            }
            \`\`\`
            
            If the user seems confused, uncooperative, or unable to respond clearly, this might be because they are using a speech to text transcription service that might not be 100% accurate. If you have repeated issues, provide a default meditation configuration with a kind message.`
          },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`Failed to get session recommendation: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in serverGetSessionRecommendation:', error);
    throw error;
  }
}



