import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  try {
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lesson_content')
      .select('*, lesson_playlists!inner(playlist_name)')
      .eq('id', id)
      .single();

    if (lessonError) throw lessonError;

    return {
      lesson
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
    const lessonTechniques = formData.get('lesson_techniques') as string || null;
    const lessonVisible = formData.has('lessonVisible');

    console.log('Lesson visibility:', lessonVisible);

    if (!lessonTitle || isNaN(lessonNumber) || !lessonContent) {
      return {
        type: 'error',
        error: 'Title, number, and content are required'
      };
    }

    try {
      const { data, error: updateError } = await supabaseAdmin
        .from('lesson_content')
        .update({
          lesson_title: lessonTitle,
          lesson_number: lessonNumber,
          lesson_content: lessonContent,
          lesson_techniques: lessonTechniques,
          visible: lessonVisible
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Fetch the updated lesson with the playlist name
      const { data: updatedLesson, error: fetchError } = await supabaseAdmin
        .from('lesson_content')
        .select('*, lesson_playlists!inner(playlist_name)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return {
        type: 'success',
        data: { lesson: updatedLesson }
      };
    } catch (err) {
      console.error('Error updating lesson:', err);
      return {
        type: 'error',
        error: 'Failed to update lesson'
      };
    }
  },

  deleteLesson: async ({ params }) => {
    const { id } = params;

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_content')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return {
        type: 'success'
      };
    } catch (err) {
      console.error('Error deleting lesson:', err);
      return {
        type: 'error',
        error: 'Failed to delete lesson'
      };
    }
  }
};