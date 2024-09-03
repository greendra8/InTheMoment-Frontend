import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMeditation } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw error(401, 'Unauthorized');
    console.log('Session:', session);
  }

  const meditationId = params.id;
  console.log(`Attempting to fetch meditation with ID: ${meditationId}`);

  try {
    const meditation = await getMeditation(meditationId);
    console.log('Fetched meditation:', JSON.stringify(meditation, null, 2));
    if (!meditation) {
      console.log(`Meditation not found: ${meditationId}`);
      throw error(404, 'Meditation not found');
    }
    return { meditation };
  } catch (err) {
    console.error('Error fetching meditation:', err);
    console.error('Full error object:', JSON.stringify(err, null, 2));
    throw error(500, 'Failed to load meditation');
  }
};