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
export async function updateUserProfile(userId: string, data: { preferences: Record<string, string>, complete: boolean }) {
  console.log('Updating user profile for userId:', userId);
  console.log('Data to update:', data);

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

  console.log('Profile updated successfully:', updatedProfile);
  return updatedProfile;
}