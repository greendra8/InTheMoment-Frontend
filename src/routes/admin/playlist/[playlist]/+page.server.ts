import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
  const { playlist } = params;

  try {
    const { data: playlistData, error: playlistError } = await supabaseAdmin
      .from('lesson_playlists')
      .select('*')
      .eq('id', playlist)
      .single();

    if (playlistError) throw playlistError;

    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select('id, lesson_number, lesson_title')
      .eq('playlist_id', playlist)
      .order('lesson_number');

    if (lessonsError) throw lessonsError;

    return {
      playlist: playlistData,
      lessons
    };
  } catch (err) {
    console.error('Error fetching playlist and lessons:', err);
    throw error(500, 'Error fetching playlist and lessons');
  }
};

export const actions: Actions = {
  addLesson: async ({ request, params }) => {
    const formData = await request.formData();
    const lessonTitle = formData.get('lessonTitle') as string;
    const { playlist } = params;

    if (!lessonTitle) {
      return { success: false, error: 'Lesson title is required' };
    }

    try {
      const { data: existingLessons, error: countError } = await supabaseAdmin
        .from('lesson_content')
        .select('lesson_number')
        .eq('playlist_id', playlist)
        .order('lesson_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const newLessonNumber = existingLessons.length > 0 ? existingLessons[0].lesson_number + 1 : 1;

      const { data, error: insertError } = await supabaseAdmin
        .from('lesson_content')
        .insert({ playlist_id: playlist, lesson_number: newLessonNumber, lesson_title: lessonTitle, lesson_content: '' })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, lesson: data };
    } catch (err) {
      console.error('Error adding lesson:', err);
      return { success: false, error: 'Failed to add lesson' };
    }
  },

  updatePlaylist: async ({ request, params }) => {
    const { playlist } = params;
    const formData = await request.formData();
    const playlistName = formData.get('playlistName') as string;
    const playlistOrder = parseInt(formData.get('playlistOrder') as string);
    const playlistDescription = formData.get('playlistDescription') as string;

    if (!playlistName || isNaN(playlistOrder)) {
      return { success: false, error: 'Playlist name and order are required' };
    }

    try {
      const { data, error: updateError } = await supabaseAdmin
        .from('lesson_playlists')
        .update({ 
          playlist_name: playlistName, 
          playlist_order: playlistOrder,
          playlist_description: playlistDescription 
        })
        .eq('id', playlist)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, playlist: data };
    } catch (err) {
      console.error('Error updating playlist:', err);
      return { success: false, error: 'Failed to update playlist' };
    }
  },

  deletePlaylist: async ({ params }) => {
    const { playlist } = params;

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_playlists')
        .delete()
        .eq('id', playlist);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting playlist:', err);
      return { success: false, error: 'Failed to delete playlist' };
    }
  }
};