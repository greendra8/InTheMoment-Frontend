import { json, error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = locals;

  if (!session) {
    console.log('No session found, redirecting to login');
    throw redirect(302, '/login');
  }

  return {
    session
  };
};

export const actions: Actions = {
  generateMeditation: async ({ request, locals }) => {
    const { session } = locals;

    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.formData();
    const userLocalTime = data.get('userLocalTime') as string;
    const length = parseInt(data.get('length') as string);
    const parameters = JSON.parse(data.get('parameters') as string);

    console.log('Server: Received form data:', { userLocalTime, length, parameters });

    try {
      console.log('Server: Calling generateMeditation');
      const result = await generateMeditation(
        session.access_token,
        length,
        userLocalTime,
        parameters
      );

      console.log('Server: Result from generateMeditation:', JSON.stringify(result, null, 2));

      // Ensure we're returning a plain object
      return {
        type: 'success',
        data: {
          meditation_id: result.data.meditation_id
        }
      };
    } catch (err) {
      console.error('Server: Meditation generation error:', err);
      return {
        type: 'error',
        message: 'An error occurred while generating the meditation. Please try again.'
      };
    }
  }
};