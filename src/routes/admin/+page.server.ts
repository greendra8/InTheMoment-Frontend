import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  try {
    const { data: playlists, error: playlistsError } = await supabaseAdmin
      .from('lesson_playlists')
      .select('id, playlist_name, playlist_order, visible')
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

export const actions: Actions = {
  addPlaylist: async ({ request }) => {
    const formData = await request.formData();
    const playlistName = formData.get('playlist') as string;

    if (!playlistName) {
      return { success: false, error: 'Playlist name is required' };
    }

    try {
      const { data: maxOrderPlaylist } = await supabaseAdmin
        .from('lesson_playlists')
        .select('playlist_order')
        .order('playlist_order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = maxOrderPlaylist ? maxOrderPlaylist.playlist_order + 1 : 1;

      const { data, error: insertError } = await supabaseAdmin
        .from('lesson_playlists')
        .insert({ playlist_name: playlistName, playlist_order: newOrder })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, playlist: data };
    } catch (err) {
      console.error('Error adding playlist:', err);
      return { success: false, error: 'Failed to add playlist' };
    }
  },

  deletePlaylist: async ({ request }) => {
    const formData = await request.formData();
    const playlistId = formData.get('playlistId') as string;

    if (!playlistId) {
      return { success: false, error: 'Playlist ID is required' };
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_playlists')
        .delete()
        .eq('id', playlistId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting playlist:', err);
      return { success: false, error: 'Failed to delete playlist' };
    }
  },

  updatePlaylistOrder: async ({ request }) => {
    const formData = await request.formData();
    const playlistOrderJson = formData.get('playlistOrder') as string;

    if (!playlistOrderJson) {
      return { success: false, error: 'Playlist order data is required' };
    }

    try {
      const playlistOrder = JSON.parse(playlistOrderJson);

      // Use a transaction to update all playlist orders
      for (const item of playlistOrder) {
        const { error: updateError } = await supabaseAdmin
          .from('lesson_playlists')
          .update({ playlist_order: item.order })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating playlist order:', err);
      return { success: false, error: 'Failed to update playlist order' };
    }
  }
};