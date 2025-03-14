import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations, getPlaylists } from '$lib/server/supabase';

// Constants
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async ({ locals, cookies }) => {
    const { session, user, profile } = locals;

    // Auth checks are now handled in hooks.server.ts
    if (!user) {
        throw error(500, 'User not available in locals');
    }

    try {
        // Get the last meditation ID from cookie if it exists
        let lastMeditationId: string | null = null;
        const lastMeditationCookie = cookies.get('last_meditation_progress');

        if (lastMeditationCookie) {
            try {
                const lastMeditationInfo = JSON.parse(lastMeditationCookie);

                // Check if the cookie data is still valid (not expired)
                const isValid =
                    lastMeditationInfo &&
                    typeof lastMeditationInfo.id === 'string' &&
                    typeof lastMeditationInfo.timestamp === 'number' &&
                    Date.now() - lastMeditationInfo.timestamp < WEEK_IN_MS;

                if (isValid) {
                    lastMeditationId = lastMeditationInfo.id;
                } else {
                    // Clear invalid cookie
                    cookies.delete('last_meditation_progress', { path: '/' });
                }
            } catch (e) {
                // Clear corrupted cookie
                cookies.delete('last_meditation_progress', { path: '/' });
            }
        }

        // Fetch data in parallel for better performance - removed profile fetch
        const [meditationsResult, playlists] = await Promise.all([
            getUserMeditations(user.id, 1, 5),
            getPlaylists(false)
        ]);

        const { data: meditations, totalCount } = meditationsResult;

        // Find the in-progress meditation if it exists in the fetched meditations
        // Only do this lookup if we have a valid lastMeditationId
        let inProgressMeditation = null;
        if (lastMeditationId && meditations && meditations.length > 0) {
            inProgressMeditation = meditations.find(m => m.id === lastMeditationId) || null;
        }

        return {
            meditations,
            totalMeditations: totalCount,
            playlists,
            user: {
                name: profile?.name || 'User',
                minutesListened: profile?.minutes_listened || 0
            },
            inProgressMeditation,
            session
        };
    } catch (err) {
        console.error('Error loading dashboard data:', err);
        throw error(500, 'Failed to load dashboard data');
    }
}; 