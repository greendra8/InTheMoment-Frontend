import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPlaylist, getPlaylistLessons } from '$lib/server/supabase';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const playlistId = params.id;
    const userId = locals.user?.id;

    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    // Only fetch visible playlists
    const playlist = await getPlaylist(playlistId, false);

    if (!playlist) {
      throw error(404, 'Playlist not found');
    }

    // Only fetch visible lessons
    const lessons = await getPlaylistLessons(playlistId, userId, false);

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

    return {
      playlist,
      lessons,
      lastCreatedLessonNumber
    };
  } catch (err) {
    console.error('Error fetching playlist and lessons:', err);
    if (err.status === 404) {
      throw error(404, 'Playlist not found');
    }
    throw error(500, 'Error fetching playlist and lessons');
  }
};