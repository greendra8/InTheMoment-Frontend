import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
  try {
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('lesson_categories')
      .select('id, category_name, category_order, category_description')
      .order('category_order');

    if (categoriesError) throw categoriesError;

    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lesson_content')
      .select('id, lesson_number, lesson_title, category_id')
      .order('lesson_number');

    if (lessonsError) throw lessonsError;

    // Group lessons by category
    const categoriesWithLessons = categories.map(category => ({
      ...category,
      lessons: lessons.filter(lesson => lesson.category_id === category.id)
    }));

    return {
      categories: categoriesWithLessons
    };
  } catch (err) {
    console.error('Error fetching categories and lessons:', err);
    throw error(500, 'Error fetching categories and lessons');
  }
};