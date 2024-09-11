import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {
    user: session.user
  };
};

export const actions: Actions = {
  generateMeditation: async ({ request, locals }) => {
    const { session } = await locals.safeGetSession();

    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.formData();
    const duration = parseInt(data.get('duration') as string);
    const userLocalTime = data.get('userLocalTime') as string;

    try {
      const result = await generateMeditation(duration, session.access_token, userLocalTime);
      return { success: true, meditation_id: result.meditation_id };
    } catch (err) {
      console.error('Meditation generation error:', err);
      return { success: false, error: 'An error occurred while generating the meditation. Please try again.' };
    }
  }
};