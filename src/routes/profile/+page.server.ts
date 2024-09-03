import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw error(401, 'Unauthorized');
  }

  try {
    const response = await fetch('http://localhost:8000/user/profile', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const profile = await response.json();
    return { profile };
  } catch (err) {
    console.error('Error fetching profile:', err);
    throw error(500, 'Failed to load profile');
  }
};

export const actions: Actions = {
  updateProfile: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();

    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const formData = await request.formData();
    const updatedProfile = Object.fromEntries(formData);

    try {
      const response = await fetch('http://localhost:8000/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, profile: result };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: 'Failed to update profile' };
    }
  }
};