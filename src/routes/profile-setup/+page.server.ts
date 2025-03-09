import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { ProfileSetup } from '$lib/stores/profileSetup';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { session } = locals;

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

		// Return the collected preferences and user ID for client-side processing
		return {
			success: true,
			userId: session.user.id,
			preferences
		};
	}
};