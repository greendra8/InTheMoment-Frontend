import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMeditation } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = await locals.supabase.auth.getSession()

  if (!session.data.session) {
    throw error(401, 'Unauthorized');
  }

  const userId = session.data.session.user.id;
  // console.log('userId', userId);

  const meditationId = params.id;

  try {
    const meditation = await getMeditation(meditationId);
    if (!meditation) {
      throw error(404, 'Meditation not found');
    }
    return { meditation, userId };
  } catch (err) {
    throw error(500, 'Failed to load meditation');
  }
};