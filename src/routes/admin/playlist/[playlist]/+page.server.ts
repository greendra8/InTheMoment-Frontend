import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
  const { playlist: playlistId } = params;

  try {
    // Get playlist details
    const { data: playlist, error: playlistError } = await supabaseAdmin
      .from('lesson_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (playlistError) throw playlistError;

    // Get lessons for this playlist
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select('id, lesson_title, lesson_number, visible')
      .eq('playlist_id', playlistId)
      .order('lesson_number', { ascending: true });

    if (lessonsError) throw lessonsError;

    return {
      playlist,
      lessons
    };
  } catch (err) {
    console.error('Error fetching playlist data:', err);
    throw error(500, 'Error fetching playlist data');
  }
};

export const actions: Actions = {
  addLesson: async ({ request, params }) => {
    const { playlist: playlistId } = params;
    const formData = await request.formData();
    const lessonTitle = formData.get('lessonTitle') as string;

    if (!lessonTitle) {
      return {
        type: 'error',
        error: 'Lesson title is required'
      };
    }

    try {
      // Get the highest lesson number for this playlist
      const { data: maxLessonData, error: maxLessonError } = await supabaseAdmin
        .from('lesson_content')
        .select('lesson_number')
        .eq('playlist_id', playlistId)
        .order('lesson_number', { ascending: false })
        .limit(1);

      if (maxLessonError) throw maxLessonError;

      const nextLessonNumber = maxLessonData.length > 0 ? maxLessonData[0].lesson_number + 1 : 1;

      // Insert new lesson
      const { error: insertError } = await supabaseAdmin.from('lesson_content').insert({
        playlist_id: playlistId,
        lesson_title: lessonTitle,
        lesson_number: nextLessonNumber,
        lesson_content: 'New lesson content',
        visible: false // Default to hidden for new lessons
      });

      if (insertError) throw insertError;

      return {
        type: 'success'
      };
    } catch (err) {
      console.error('Error adding lesson:', err);
      return {
        type: 'error',
        error: 'Failed to add lesson'
      };
    }
  },

  updatePlaylist: async ({ request, params }) => {
    const { playlist: playlistId } = params;
    const formData = await request.formData();

    const playlistName = formData.get('playlistName') as string;
    const playlistOrder = parseInt(formData.get('playlistOrder') as string);
    const playlistDescription = formData.get('playlistDescription') as string || null;
    const playlistVisible = formData.has('playlistVisible');

    console.log('Playlist visibility:', playlistVisible);

    if (!playlistName || isNaN(playlistOrder)) {
      return {
        type: 'error',
        error: 'Name and order are required'
      };
    }

    try {
      const { error: updateError } = await supabaseAdmin
        .from('lesson_playlists')
        .update({
          playlist_name: playlistName,
          playlist_order: playlistOrder,
          playlist_description: playlistDescription,
          visible: playlistVisible
        })
        .eq('id', playlistId);

      if (updateError) throw updateError;

      return {
        type: 'success'
      };
    } catch (err) {
      console.error('Error updating playlist:', err);
      return {
        type: 'error',
        error: 'Failed to update playlist'
      };
    }
  },

  deletePlaylist: async ({ params }) => {
    const { playlist: playlistId } = params;

    try {
      // First delete all lessons in this playlist
      const { error: deleteLessonsError } = await supabaseAdmin
        .from('lesson_content')
        .delete()
        .eq('playlist_id', playlistId);

      if (deleteLessonsError) throw deleteLessonsError;

      // Then delete the playlist
      const { error: deletePlaylistError } = await supabaseAdmin
        .from('lesson_playlists')
        .delete()
        .eq('id', playlistId);

      if (deletePlaylistError) throw deletePlaylistError;

      return {
        type: 'success'
      };
    } catch (err) {
      console.error('Error deleting playlist:', err);
      return {
        type: 'error',
        error: 'Failed to delete playlist'
      };
    }
  },

  updateLessonOrder: async ({ request }) => {
    const formData = await request.formData();
    const lessonOrderJson = formData.get('lessonOrder') as string;

    if (!lessonOrderJson) {
      return {
        type: 'error',
        error: 'Lesson order data is required'
      };
    }

    try {
      const lessonOrder = JSON.parse(lessonOrderJson);

      // Update each lesson's order
      for (const item of lessonOrder) {
        const { error: updateError } = await supabaseAdmin
          .from('lesson_content')
          .update({ lesson_number: item.order })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      return {
        type: 'success'
      };
    } catch (err) {
      console.error('Error updating lesson order:', err);
      return {
        type: 'error',
        error: 'Failed to update lesson order'
      };
    }
  }
};