import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = locals;

	// Auth checks are now handled in hooks.server.ts
	if (!profile) {
		throw error(500, 'Profile not available in locals');
	}

	// Simply return the profile from locals - no database call needed
	return { profile };
};
