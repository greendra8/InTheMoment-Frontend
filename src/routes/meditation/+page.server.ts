import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {};
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
      if (result.meditation_url && result.meditation_id) {
        return { success: true, meditation: result };
      } else {
        return { success: false, error: 'Failed to generate meditation. Please try again.' };
      }
    } catch (err) {
      console.error('Meditation generation error:', err);
      return { success: false, error: 'An error occurred while generating the meditation. Please try again.' };
    }
  }
};