import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  try {
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('lesson_categories')
      .select('id, category_name, category_order')
      .order('category_order');

    if (categoriesError) throw categoriesError;

    return {
      categories
    };
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw error(500, 'Error fetching categories');
  }
};

export const actions: Actions = {
  addCategory: async ({ request }) => {
    const formData = await request.formData();
    const categoryName = formData.get('category') as string;

    if (!categoryName) {
      return { success: false, error: 'Category name is required' };
    }

    try {
      const { data: maxOrderCategory } = await supabaseAdmin
        .from('lesson_categories')
        .select('category_order')
        .order('category_order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = maxOrderCategory ? maxOrderCategory.category_order + 1 : 1;

      const { data, error: insertError } = await supabaseAdmin
        .from('lesson_categories')
        .insert({ category_name: categoryName, category_order: newOrder })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, category: data };
    } catch (err) {
      console.error('Error adding category:', err);
      return { success: false, error: 'Failed to add category' };
    }
  },

  deleteCategory: async ({ request }) => {
    const formData = await request.formData();
    const categoryId = formData.get('categoryId') as string;

    if (!categoryId) {
      return { success: false, error: 'Category ID is required' };
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: 'Failed to delete category' };
    }
  }
};