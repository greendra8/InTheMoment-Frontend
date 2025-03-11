import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations, getUserProfile, getPlaylists } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
    const { session } = locals;

    if (!session) {
        throw redirect(303, '/login');
    }

    if (!session.user || !session.user.id) {
        throw error(500, 'Invalid session data');
    }

    try {
        // Fetch recent meditations (limit to 5 for recency)
        const { data: meditations, totalCount } = await getUserMeditations(session.user.id, 1, 5);

        // Fetch visible playlists only
        const playlists = await getPlaylists(false);

        // Fetch user profile for stats using the helper function
        const profile = await getUserProfile(session.user.id);

        return {
            meditations,
            totalMeditations: totalCount,
            playlists,
            user: {
                name: profile.name || 'User',
                minutesListened: profile.minutes_listened || 0
            },
            session
        };
    } catch (err) {
        console.error('Error loading dashboard data:', err);
        throw error(500, 'Failed to load dashboard data');
    }
}; 