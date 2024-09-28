import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMeditation, getFeedback } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = await locals.supabase.auth.getSession();

  if (!session.data.session) {
    console.log('No session found, throwing 401 error');
    throw error(401, 'Unauthorized');
  }

  const userId = session.data.session.user.id;
  const meditationId = params.id;

  if (!meditationId || meditationId.includes('.')) {
    console.log(`Invalid meditation ID: ${meditationId}`);
    throw error(404, 'Invalid meditation ID');
  }

  try {
    const meditation = await getMeditation(meditationId);
    if (!meditation) {
      console.log('Meditation not found, throwing 404 error');
      throw error(404, 'Meditation not found');
    }

    const feedback = await getFeedback(meditationId, userId);

    return { 
      meditation,
      userId, 
      feedback: feedback || null
    };
  } catch (err) {
    console.error('Error in load function:', err);
    if (err instanceof Error && 'status' in err && err.status === 404) {
      throw error(404, 'Meditation not found');
    }
    throw error(500, 'Failed to load meditation');
  }
};