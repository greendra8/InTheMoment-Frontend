import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {
    user: session.user,
    session  // Add this line to include the session in the returned data
  };
};

export const actions: Actions = {
  generateMeditation: async ({ request, locals }) => {
    const { session } = await locals.safeGetSession();

    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.formData();
    const userLocalTime = data.get('userLocalTime') as string;
    const length = parseInt(data.get('length') as string);
    const parameters = JSON.parse(data.get('parameters') as string);

    try {
      const result = await generateMeditation(session.access_token, length, userLocalTime, parameters);
      return { success: true, meditation_id: result.meditation_id };
    } catch (err) {
      console.error('Meditation generation error:', err);
      return { success: false, error: 'An error occurred while generating the meditation. Please try again.' };
    }
  }
};