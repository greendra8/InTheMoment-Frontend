import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin, getUserMeditations, getUserProfile } from '$lib/server/supabase';

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

        // Fetch all playlists
        const { data: playlists, error: playlistsError } = await supabaseAdmin
            .from('lesson_playlists')
            .select('id, playlist_name, playlist_description')
            .order('playlist_order');

        if (playlistsError) throw playlistsError;

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