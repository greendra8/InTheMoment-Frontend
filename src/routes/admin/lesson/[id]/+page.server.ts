import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  try {
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lesson_content')
      .select('*, lesson_playlists!inner(id, playlist_name)')
      .eq('id', id)
      .single();

    if (lessonError) throw lessonError;

    if (!lesson) {
      throw error(404, 'Lesson not found');
    }

    return {
      lesson: {
        ...lesson,
        playlist_id: lesson.lesson_playlists.id,
        playlist_name: lesson.lesson_playlists.playlist_name
      }
    };
  } catch (err) {
    console.error('Error fetching lesson:', err);
    throw error(500, 'Error fetching lesson');
  }
};

export const actions: Actions = {
  updateLesson: async ({ request, params }) => {
    const { id } = params;
    const formData = await request.formData();
    const lessonTitle = formData.get('lesson_title') as string;
    const lessonNumber = parseInt(formData.get('lesson_number') as string);
    const lessonContent = formData.get('lesson_content') as string;
    const lessonTechniques = formData.get('lesson_techniques') as string;

    try {
      const { data, error: updateError } = await supabaseAdmin
        .from('lesson_content')
        .update({ lesson_number: lessonNumber, lesson_title: lessonTitle, lesson_content: lessonContent, lesson_techniques: lessonTechniques })
        .eq('id', id)
        .select('*, lesson_playlists!inner(playlist_name)')
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        lesson: {
          ...data,
          playlist_name: data.lesson_playlists.playlist_name
        }
      };
    } catch (err) {
      console.error('Error updating lesson:', err);
      return { success: false, error: 'Failed to update lesson' };
    }
  },

  deleteLesson: async ({ params }) => {
    const { id } = params;

    try {
      const { data: lesson, error: fetchError } = await supabaseAdmin
        .from('lesson_content')
        .select('playlist_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabaseAdmin
        .from('lesson_content')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      if (err instanceof Response) throw err;
      console.error('Error deleting lesson:', err);
      return { success: false, error: 'Failed to delete lesson' };
    }
  }
};