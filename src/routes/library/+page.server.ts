import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations } from '$lib/server/supabase';


export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;

	if (!session) {
		console.log('No session found, redirecting to login'); // Add this log
		throw redirect(303, '/login');
	}

	if (!session.user || !session.user.id) {
		console.error('Session user or user ID is undefined:', session); // Add this log
		throw error(500, 'Invalid session data');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');

	try {
		const { data: meditations, totalCount } = await getUserMeditations(session.user.id, page, limit);
		return {
			meditations,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			limit,
			currentPage: page,
			session // Pass session to page.svelte via prop
		};
	} catch (err) {
		console.error('Failed to load meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};