import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { ProfileSetup } from '$lib/stores/profileSetup';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { user } = locals;

		// Auth checks are now handled in hooks.server.ts
		if (!user) {
			throw error(500, 'User not available in locals');
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

		// Return the collected preferences and user ID for client-side processing
		return {
			success: true,
			userId: user.id,
			preferences
		};
	}
};