import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { ProfileSetup } from '$lib/stores/profileSetup';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		console.log('[Server Action] Submit action called.');
		const { user } = locals;

		// Auth checks are now handled in hooks.server.ts
		if (!user) {
			console.error('[Server Action] User not available in locals.');
			// Returning a fail instead of throwing error to provide more info to client
			return fail(401, { message: 'User not authenticated.' });
		}
		console.log('[Server Action] User ID:', user.id);

		try {
			const formData = await request.formData();
			console.log('[Server Action] Received FormData keys:', Array.from(formData.keys()));
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
				} else {
					console.warn(`[Server Action] Value for key "${key}" was not a string:`, value);
				}
			}

			console.log('[Server Action] Collected preferences:', preferences);

			const result = {
				success: true,
				userId: user.id,
				preferences
			};
			console.log('[Server Action] Returning success result:', result);
			// Return the collected preferences and user ID for client-side processing
			return result;
		} catch (e) {
			console.error('[Server Action] Error processing form data:', e);
			return fail(500, { message: 'Error processing profile data on server.' });
		}
	}
};