import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { user, session } = await parent();

	if (!session || !session.access_token) {
		throw error(401, 'Unauthorized');
	}

	try {
		const response = await fetch(`http://localhost:8000/meditations/${user.id}`, {
			headers: {
				 'Authorization': `Bearer ${session.access_token}`
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch meditations: ${response.statusText}`);
		}

		const meditations = await response.json();
		return { meditations };
	} catch (err) {
		console.error('Error fetching meditations:', err);
		throw error(500, 'Failed to load meditations');
	}
};