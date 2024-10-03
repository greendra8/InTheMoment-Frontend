import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
  const { category } = params;

  try {
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('lesson_categories')
      .select('*')
      .eq('id', category)
      .single();

    if (categoryError) throw categoryError;

    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select('id, lesson_number, lesson_title')
      .eq('category_id', category)
      .order('lesson_number');

    if (lessonsError) throw lessonsError;

    return {
      category: categoryData,
      lessons
    };
  } catch (err) {
    console.error('Error fetching category and lessons:', err);
    throw error(500, 'Error fetching category and lessons');
  }
};

export const actions: Actions = {
  addLesson: async ({ request, params }) => {
    const formData = await request.formData();
    const lessonTitle = formData.get('lessonTitle') as string;
    const { category } = params;

    if (!lessonTitle) {
      return { success: false, error: 'Lesson title is required' };
    }

    try {
      const { data: existingLessons, error: countError } = await supabaseAdmin
        .from('lesson_content')
        .select('lesson_number')
        .eq('category_id', category)
        .order('lesson_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const newLessonNumber = existingLessons.length > 0 ? existingLessons[0].lesson_number + 1 : 1;

      const { data, error: insertError } = await supabaseAdmin
        .from('lesson_content')
        .insert({ category_id: category, lesson_number: newLessonNumber, lesson_title: lessonTitle, lesson_content: '' })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, lesson: data };
    } catch (err) {
      console.error('Error adding lesson:', err);
      return { success: false, error: 'Failed to add lesson' };
    }
  },

  updateCategory: async ({ request, params }) => {
    const { category } = params;
    const formData = await request.formData();
    const categoryName = formData.get('categoryName') as string;
    const categoryOrder = parseInt(formData.get('categoryOrder') as string);
    const categoryDescription = formData.get('categoryDescription') as string;

    if (!categoryName || isNaN(categoryOrder)) {
      return { success: false, error: 'Category name and order are required' };
    }

    try {
      const { data, error: updateError } = await supabaseAdmin
        .from('lesson_categories')
        .update({ 
          category_name: categoryName, 
          category_order: categoryOrder,
          category_description: categoryDescription 
        })
        .eq('id', category)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, category: data };
    } catch (err) {
      console.error('Error updating category:', err);
      return { success: false, error: 'Failed to update category' };
    }
  },

  deleteCategory: async ({ params }) => {
    const { category } = params;

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_categories')
        .delete()
        .eq('id', category);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: 'Failed to delete category' };
    }
  }
};