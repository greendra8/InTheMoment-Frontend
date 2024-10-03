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

    return {
      playlists
    };
  } catch (err) {
    console.error('Error fetching playlists:', err);
    throw error(500, 'Error fetching playlists');
  }
};