import type { PageServerLoad } from './$types';
import { getUserMeditations, supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
    const { session } = locals;

    if (!session) {
        return {
            status: 302,
            redirect: '/login'
        };
    }

    try {
        // Fetch both meditations and playlists in parallel
        const [meditationsResult, playlistsResult] = await Promise.all([
            getUserMeditations(session.user.id),
            supabaseAdmin
                .from('lesson_playlists')
                .select('id, playlist_name, playlist_order, playlist_description')
                .order('playlist_order')
        ]);

        if (playlistsResult.error) throw playlistsResult.error;

        return {
            meditations: meditationsResult.data,
            playlists: playlistsResult.data,
            user: session.user
        };
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        return {
            meditations: [],
            playlists: [],
            user: session.user
        };
    }
};
