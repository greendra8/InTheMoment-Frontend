import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {
    accessToken: session.access_token // Pass the access token to the client
  };
};

export const actions: Actions = {
  generateMeditation: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();

    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.formData();
    const duration = parseInt(data.get('duration') as string);

    try {
      const response = await fetch('http://localhost:8000/generate_meditation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ length: duration }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to generate meditation: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Meditation generation started:', result);
      if (result.status === 'processing' && result.meditation_id) {
        return { success: true, message: 'Meditation generation started', meditation_id: result.meditation_id };
      } else {
        return { success: false, error: 'Failed to start meditation generation. Please try again.' };
      }
    } catch (err) {
      console.error('Meditation generation error:', err);
      return { success: false, error: 'An error occurred while generating the meditation. Please try again.' };
    }
  }
};