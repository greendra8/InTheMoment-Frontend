import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/login');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	try {
		const meditations = await getUserMeditations(session.user.id, page, limit);
		return { 
			meditations,
			currentPage: page
		};
	} catch (err) {
		console.error('Failed to load meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};