import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	try {
		const meditations = await getUserMeditations(session.user.id, page, limit);
		console.log('Fetched meditations:', meditations);
		return { 
			meditations,
			currentPage: page
		};
	} catch (err) {
		console.error('Error fetching meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};