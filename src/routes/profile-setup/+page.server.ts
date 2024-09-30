import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { updateUserProfile } from '$lib/server/supabase';
import type { ProfileSetup } from '$lib/stores/profileSetup';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { session } = await locals.safeGetSession();

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const preferences: Partial<ProfileSetup> = {};

		// Define the expected keys
		const expectedKeys: (keyof ProfileSetup)[] = [
			'meditationGoal',
			'stressLevel',
			'sleepPattern',
			'focusDuration',
			'mentalState',
			'techUsage'
		];

		// Process only the expected keys from the form data
		for (const key of expectedKeys) {
			const value = formData.get(key);
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