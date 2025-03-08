import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const profile = await getUserProfile(session.user.id);
		return { profile, session };
	} catch (err) {
		throw error(500, 'Failed to load user profile');
	}
};
