import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	// This makes the function re-run when this dependency is invalidated
	depends('library:meditations');

	const { user } = locals;

	// Auth checks are now handled in hooks.server.ts
	if (!user) {
		throw error(500, 'User not available in locals');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const contentType = url.searchParams.get('contentType') as 'meditation' | 'hypnosis' | null;

	try {
		const { data: meditations, totalCount } = await getUserMeditations(
			user.id,
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
			activeFilter: contentType || 'all'
			// No need to return session, it's already available in +layout.server.ts
		};
	} catch (err) {
		console.error('Failed to load meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};