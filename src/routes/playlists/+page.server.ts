import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPlaylists } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  try {
    // Only fetch visible playlists
    const playlists = await getPlaylists(20, false);

    return {
      playlists
    };
  } catch (err) {
    console.error('Error fetching playlists:', err);
    throw error(500, 'Error fetching playlists');
  }
};