import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMeditation, getFeedback } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  console.log('Starting load function for meditation page');
  const session = await locals.supabase.auth.getSession()

  if (!session.data.session) {
    console.log('No session found, throwing 401 error');
    throw error(401, 'Unauthorized');
  }

  const userId = session.data.session.user.id;
  const meditationId = params.id;
  console.log(`UserId: ${userId}, MeditationId: ${meditationId}`);

  try {
    console.log('Fetching meditation data');
    const meditation = await getMeditation(meditationId);
    if (!meditation) {
      console.log('Meditation not found, throwing 404 error');
      throw error(404, 'Meditation not found');
    }

    console.log('Fetching feedback data');
    const feedback = await getFeedback(meditationId, userId);
    console.log('Feedback data:', feedback);

    return { meditation, userId, feedback: feedback || null };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'Failed to load meditation');
  }
};