import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	// This makes the function re-run when this dependency is invalidated
	depends('library:meditations');

	const { session } = locals;

	if (!session) {
		console.log('No session found, redirecting to login');
		throw redirect(303, '/login');
	}

	if (!session.user || !session.user.id) {
		console.error('Session user or user ID is undefined:', session);
		throw error(500, 'Invalid session data');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const contentType = url.searchParams.get('contentType') as 'meditation' | 'hypnosis' | null;

	try {
		const { data: meditations, totalCount } = await getUserMeditations(
			session.user.id,
			page,
			limit,
			contentType || undefined
		);

		return {
			meditations,
			totalCount: totalCount || 0,
			totalPages: Math.ceil((totalCount || 0) / limit),
			limit,
			currentPage: page,
			activeFilter: contentType || 'all',
			session
		};
	} catch (err) {
		console.error('Failed to load meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};