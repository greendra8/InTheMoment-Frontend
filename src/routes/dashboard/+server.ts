import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch, locals }) => {
    const { session } = await locals.safeGetSession();

    if (!session || !session.access_token) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';

    try {
        const response = await fetch(`http://localhost:8000/meditations/${session.user.id}?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch meditations: ${response.statusText}`);
        }

        const meditations = await response.json();
        return json({ meditations, currentPage: parseInt(page) });
    } catch (err) {
        console.error('Error fetching meditations:', err);
        return json({ error: 'Failed to load meditations' }, { status: 500 });
    }
};