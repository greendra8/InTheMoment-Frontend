import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '10';

	try {
		const response = await fetch(`/dashboard?page=${page}&limit=${limit}`);
		if (!response.ok) throw new Error(response.statusText);
		return await response.json();
	} catch (err) {
		console.error('Error fetching meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};