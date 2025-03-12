// $lib/api.ts
import { supabase } from '$lib/supabaseClient';

// Define your client-side helper functions here

export async function getUserMeditations(userId: string, page: number = 1, limit: number = 10) {
  const { data, error } = await supabase
    .from('audio_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('generation_status', 'Completed')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return data;
}

export function subscribeMeditationStatus(meditationId: string, callback: (status: string) => void) {
  let isSubscribed = false;
  let timeoutId: NodeJS.Timeout;

  // Fetch the current status after 2 seconds
  setTimeout(() => {
    supabase
      .from('audio_sessions')
      .select('generation_status')
      .eq('id', meditationId)
      .single()
      .then(({ data, error }) => {
        if (!error && data && isSubscribed) {
          callback(data.generation_status);
        }
      });
  }, 2000);

  const channel = supabase
    .channel(`meditation-${meditationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'audio_sessions',
        filter: `id=eq.${meditationId}`
      },
      (payload) => {
        if (payload.new && payload.new.generation_status) {
          callback(payload.new.generation_status);
        }
      }
    )
    .subscribe((status) => {
      isSubscribed = status === 'SUBSCRIBED';
    });

  // Set a timeout to unsubscribe after 5 minutes (300000 milliseconds)
  timeoutId = setTimeout(() => {
    if (isSubscribed) {
      isSubscribed = false;
      supabase.removeChannel(channel);
    }
  }, 300000);

  return () => {
    isSubscribed = false;
    supabase.removeChannel(channel);
    clearTimeout(timeoutId);
  };
}

export async function submitFeedback(sessionId: string, profileId: string, feedback: string) {
  try {
    // Check if a record already exists
    const { data: existingFeedback, error: checkError } = await supabase
      .from('audio_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing feedback:', checkError);
      throw checkError;
    }

    const feedbackData = {
      feedback: { text: feedback },
      modified_at: new Date().toISOString()
    };

    let result;
    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('audio_feedback')
        .update(feedbackData)
        .eq('session_id', sessionId)
        .eq('profile_id', profileId)
        .select();

      if (error) throw error;
      result = data;
    } else {
      // Insert new feedback
      const { data, error } = await supabase
        .from('audio_feedback')
        .insert({
          ...feedbackData,
          session_id: sessionId,
          profile_id: profileId
        })
        .select();

      if (error) throw error;
      result = data;
    }

    console.log('Submitted feedback');
    return result[0];
  } catch (err) {
    console.error('Caught error in submitFeedback:', err);
    throw err;
  }
}


// Helper function to mark a meditation as complete
export async function completeMeditation(meditationId: string, userId: string, minutesCompleted: number) {
  // Check if the meditation was last listened to within the last 12 hours
  const { data: meditationData, error: meditationError } = await supabase
    .from('audio_sessions')
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
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('minutes_listened')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const updatedMinutes = (userData.minutes_listened || 0) + minutesCompleted

  const { error: updateUserError } = await supabase
    .from('profiles')
    .update({ minutes_listened: updatedMinutes })
    .eq('id', userId)

  if (updateUserError) throw updateUserError

  // Update last_listened timestamp and listened status for the meditation
  const { error: updateMeditationError } = await supabase
    .from('audio_sessions')
    .update({
      last_listened: new Date().toISOString(),
      listened: true
    })
    .eq('id', meditationId)

  if (updateMeditationError) throw updateMeditationError

  console.log('Meditation completed and user total time updated successfully.')
}


// Helper function to update user profile
export async function updateUserProfile(userId: string, data: {
  name?: string;
  experience?: string;
  voice_id?: number;
  preferences?: any;
  complete?: boolean;
}) {
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return updatedProfile;
}

// Update user theme function
export async function updateUserTheme(userId: string, theme: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user theme:', error);
    throw error;
  }

  return data;
}

// Pre-session check-in functions
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob);
  formData.append('model', 'openai/whisper-large-v3-turbo');

  const response = await fetch('https://api.deepinfra.com/v1/openai/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DEEPINFRA_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  const data = await response.json();
  return data.text;
}

export async function getSessionRecommendation(messages: Array<{ role: string, content: string }>) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'HTTP-Referer': import.meta.env.VITE_APP_URL,
      'X-Title': 'In The Moment'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-pro-exp-02-05:free',
      messages: [
        {
          role: 'system',
          content: `You are a meditation teacher's assistant helping to configure meditation sessions. Imagine they have just entered the room and you're looking to guage their current state and needs.
          Based on the user's responses, you should ask 2-3 relevant follow-up questions to understand their current state and needs.
          After gathering sufficient information, provide a session configuration in JSON format with these fields:
          - length: number (5-45 minutes, must be one of: 5, 10, 15, 20, 25, 30, 35, 40, 45)
          - posture: "sitting" | "lying" | "walking"
          - eyes: "open" | "closed"
          
          Example questions:
          - What have you been up to today?
          - What are you going to do after today's session?
          - How have your emotions been lately?
          - Have you had a chance to practice mindfulness outside of our sessions?
          - What's been on your mind recently?
          - Are you happy with your progress in our sessions?
          - Any recent issues or stresses you'd like to discuss?
          - Did you try mindfulness or meditation since last time? How was it?
          - Which meditation techniques have been helpful or tough recently?
          - Noticed any changes in yourself or your practice since we began?
          - Got a specific goal for today’s session?
          - Any physical sensations or discomforts to address today?
          - Anything else to share or requests for today’s session?

          Keep your response less than 250 characters.

          Don't ask how long the session should be - this is up to you to decide and they can always override your choice.

          
          Your responses should be either:
          1. A follow-up question (if you need more information)
          2. A final response with a friendly message followed by the JSON configuration in this format:
          
          [Your friendly message here]
          
          \`\`\`json
          {
            "length": 15,
            "posture": "sitting",
            "eyes": "closed"
          }
          \`\`\`
          
          If the user seems confused, uncooperative, or unable to respond clearly, provide a default configuration with a kind message.`
        },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    console.error('Error from OpenRouter:', await response.text());
    throw new Error('Failed to get session recommendation');
  }

  const data = await response.json();
  console.log('OpenRouter response:', data);
  return data.choices[0].message.content;
}
