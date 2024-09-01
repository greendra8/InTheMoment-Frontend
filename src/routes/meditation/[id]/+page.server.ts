import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const meditationId = params.id;

  try {
    const response = await fetch(`http://localhost:8000/meditation/${meditationId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meditation: ${response.statusText}`);
    }

    const meditation = await response.json();
    return { meditation };
  } catch (err) {
    console.error('Error fetching meditation:', err);
    throw error(500, 'Failed to load meditation');
  }
};