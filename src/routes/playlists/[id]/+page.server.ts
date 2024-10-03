import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const playlistId = params.id;
    const userId = locals.user?.id;

    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    const { data: playlist, error: playlistError } = await supabaseAdmin
      .from('lesson_playlists')
      .select('id, playlist_name, playlist_description')
      .eq('id', playlistId)
      .single();

    if (playlistError) throw playlistError;

    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select(`
        id, 
        lesson_number, 
        lesson_title,
        audio_sessions (
          id
        )
      `)
      .eq('playlist_id', playlistId)
      .eq('audio_sessions.user_id', userId)
      .eq('audio_sessions.generation_status', 'Completed')
      .order('lesson_number');

    if (lessonsError) throw lessonsError;

    // Fetch user progress
    const { data: userProgress, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('last_created_lesson_number')
      .eq('user_id', userId)
      .eq('playlist_id', playlistId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError;
    }

    const lastCreatedLessonNumber = userProgress?.last_created_lesson_number || 0;

    // Process lessons to include meditation info
    const processedLessons = lessons.map(lesson => ({
      ...lesson,
      meditationId: lesson.audio_sessions[0]?.id || null
    }));

    return {
      playlist,
      lessons: processedLessons,
      lastCreatedLessonNumber
    };
  } catch (err) {
    console.error('Error fetching playlist and lessons:', err);
    throw error(500, 'Error fetching playlist and lessons');
  }
};