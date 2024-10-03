import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  try {
    const { data: playlists, error: playlistsError } = await supabaseAdmin
      .from('lesson_playlists')
      .select('id, playlist_name, playlist_order, playlist_description')
      .order('playlist_order');

    if (playlistsError) throw playlistsError;

    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select('id, lesson_number, lesson_title, playlist_id')
      .order('lesson_number');

    if (lessonsError) throw lessonsError;

    // Group lessons by playlist
    const playlistsWithLessons = playlists.map(playlist => ({
      ...playlist,
      lessons: lessons.filter(lesson => lesson.playlist_id === playlist.id)
    }));

    return {
      playlists: playlistsWithLessons
    };
  } catch (err) {
    console.error('Error fetching playlists and lessons:', err);
    throw error(500, 'Error fetching playlists and lessons');
  }
};