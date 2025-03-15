import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMeditation, getFeedback } from '$lib/server/supabase';


export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  const { user } = locals;

  // Auth checks are now handled in hooks.server.ts
  if (!user) {
    throw error(500, 'User not available in locals');
  }

  const userId = user.id;
  const meditationId = params.id;

  // Get fullscreen preference from cookies
  const fullscreenPreference = cookies.get('meditation_fullscreen_preference') === 'true';

  if (!meditationId || meditationId.includes('.')) {
    console.log(`Invalid meditation ID: ${meditationId}`);
    throw error(404, 'Invalid meditation ID');
  }

  try {
    let meditation;
    meditation = await getMeditation(meditationId);

    if (!meditation) {
      console.log('Meditation not found, throwing 404 error');
      throw error(404, 'Meditation not found');
    }

    const feedback = await getFeedback(meditationId, userId);

    return {
      meditation,
      userId,
      feedback: feedback || null,
      fullscreenPreference
    };
  } catch (err) {
    console.error('Error in load function:', err);
    if (err instanceof Error && 'status' in err && err.status === 404) {
      throw error(404, 'Meditation not found');
    }
    throw error(500, 'Failed to load meditation');
  }
};