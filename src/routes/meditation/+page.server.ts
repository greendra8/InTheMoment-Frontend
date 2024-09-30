import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';


export const load: PageServerLoad = async ({ locals }) => {
  const { session } = locals;

  if (!session) {
    console.log('No session found, redirecting to login');
    throw redirect(302, '/login');
  }

  return {
    user: session.user,
    session
  };
};

export const actions: Actions = {
  generateMeditation: async ({ request, locals }) => {
    console.log('generateMeditation action called');
    const { session } = locals;

    if (!session) {
      console.error('No session found in generateMeditation action');
      throw error(401, 'Unauthorized');
    }

    console.log('Session in generateMeditation action:', session);

    const data = await request.formData();
    const userLocalTime = data.get('userLocalTime') as string;
    const length = parseInt(data.get('length') as string);
    const parameters = JSON.parse(data.get('parameters') as string);

    console.log('Received form data:', {
      userLocalTime,
      length,
      parameters
    });

    try {
      console.log('Calling generateMeditation function');
      const result = await generateMeditation(session.access_token, length, userLocalTime, parameters);
      console.log('Meditation generation result:', result);
      return { success: true, meditation_id: result.meditation_id };
    } catch (err) {
      console.error('Meditation generation error:', err);
      return { success: false, error: 'An error occurred while generating the meditation. Please try again.' };
    }
  }
};