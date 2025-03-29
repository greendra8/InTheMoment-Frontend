import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { isAdminUser } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

// Admin check middleware - reused for all admin endpoints
function checkAdminAccess(locals: App.Locals) {
  if (!isAdminUser(locals)) {
    throw error(403, 'Unauthorized - Admin access required');
  }
}

export const POST: RequestHandler = async ({ request, url, locals }) => {
  // Authentication check
  checkAdminAccess(locals);

  const path = url.pathname.split('/').pop();

  if (path === 'playlist') {
    const { playlist } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('lesson_content')
      .insert({ playlist, lesson_number: 1, lesson_title: 'Introduction', lesson_content: 'Welcome to this new playlist' })
      .select()
      .single();

    if (error) throw error;
    return json(data);
  }

  if (path === 'lesson') {
    const { playlist, lessonTitle, lessonNumber } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('lesson_content')
      .insert({ playlist, lesson_number: lessonNumber, lesson_title: lessonTitle, lesson_content: '' })
      .select()
      .single();

    if (error) throw error;
    return json(data);
  }

  return json({ error: 'Invalid endpoint' }, { status: 400 });
};

export const PUT: RequestHandler = async ({ request, params, locals, url }) => {
  // Authentication check
  checkAdminAccess(locals);

  // Fix for the type error from linter
  const id = url.pathname.split('/').pop();
  if (!id) {
    return json({ error: 'Missing ID parameter' }, { status: 400 });
  }

  const lesson = await request.json();
  const { data, error } = await supabaseAdmin
    .from('lesson_content')
    .update({ lesson_number: lesson.lesson_number, lesson_title: lesson.lesson_title, lesson_content: lesson.lesson_content })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return json(data);
};

export const DELETE: RequestHandler = async ({ params, url, locals }) => {
  // Authentication check
  checkAdminAccess(locals);

  const path = url.pathname.split('/');
  const type = path[path.length - 2];
  const value = decodeURIComponent(path[path.length - 1]);

  let error;

  if (type === 'playlist') {
    ({ error } = await supabaseAdmin
      .from('lesson_content')
      .delete()
      .eq('playlist', value));
  } else if (type === 'lesson') {
    ({ error } = await supabaseAdmin
      .from('lesson_content')
      .delete()
      .eq('id', value));
  } else {
    return json({ error: 'Invalid delete operation' }, { status: 400 });
  }

  if (error) throw error;
  return json({ success: true });
};