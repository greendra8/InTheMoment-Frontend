import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { updateUserProfile } from '$lib/supabase';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { session } = await locals.safeGetSession();

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const preferences: Record<string, string> = {};

		// Collect all form data in the original order
		for (const [key, value] of formData.entries()) {
			if (typeof value === 'string') {
				preferences[key] = value;
			}
		}

		console.log('Collected preferences:', preferences);

		try {
			const updatedProfile = await updateUserProfile(session.user.id, { 
				preferences,
				complete: true
			});
			console.log('Profile updated successfully:', updatedProfile);
			return { success: true, profile: updatedProfile };
		} catch (err) {
			console.error('Error updating user profile:', err);
			return fail(500, { message: 'Failed to update profile' });
		}
	}
};