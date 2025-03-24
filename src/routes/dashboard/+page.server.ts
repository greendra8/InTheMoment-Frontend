import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserMeditations, getPlaylists, getUserRecentPlaylists } from '$lib/server/supabase';
import { assignBackgrounds } from '$lib/utils/backgroundPatterns';
import { TIMEZONE_OFFSET_COOKIE, adjustToUserTimezone, getTimeOfDayFromHour } from '$lib/utils/time';

// Constants
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;


export const load: PageServerLoad = async ({ locals, cookies }) => {
    const { session, user, profile } = locals;

    // Auth checks are now handled in hooks.server.ts
    if (!user) {
        throw error(500, 'User not available in locals');
    }

    try {
        // Get timezone offset from cookie
        let timezoneOffset = 0;
        const timezoneOffsetCookie = cookies.get(TIMEZONE_OFFSET_COOKIE);

        if (timezoneOffsetCookie) {
            try {
                timezoneOffset = parseInt(timezoneOffsetCookie);
            } catch (e) {
                console.warn('Failed to parse timezone offset cookie:', e);
            }
        }

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
        const [meditationsResult, playlistsData, recentPlaylistsData] = await Promise.all([
            getUserMeditations(user.id, 1, 3),
            getPlaylists(2, false),
            getUserRecentPlaylists(user.id, 4)
        ]);

        const { data: meditations, totalCount } = meditationsResult;

        // Assign background patterns to meditations and playlists using the shared utility
        const meditationsWithBackgrounds = assignBackgrounds(meditations);
        const playlistsWithBackgrounds = assignBackgrounds(playlistsData);
        const recentPlaylistsWithBackgrounds = assignBackgrounds(recentPlaylistsData);

        // Find the in-progress meditation if it exists in the fetched meditations
        // Only do this lookup if we have a valid lastMeditationId
        let inProgressMeditation = null;
        if (lastMeditationId && meditationsWithBackgrounds && meditationsWithBackgrounds.length > 0) {
            inProgressMeditation = meditationsWithBackgrounds.find(m => m.id === lastMeditationId) || null;
        }

        // Determine time-based sessions with user's local time
        const currentTimeOfDay = getTimeOfDay(timezoneOffset);
        const {
            hasMorningSession,
            hasMiddaySession,
            hasEveningSession,
            morningSession,
            middaySession,
            eveningSession
        } = checkTimedSessions(meditationsWithBackgrounds, timezoneOffset);

        return {
            meditations: meditationsWithBackgrounds,
            totalMeditations: totalCount,
            playlists: playlistsWithBackgrounds,
            recentPlaylists: recentPlaylistsWithBackgrounds,
            user: {
                name: profile?.name || 'User',
                minutesListened: profile?.minutes_listened || 0
            },
            inProgressMeditation,
            session,
            // Add time-based session data
            currentTimeOfDay,
            hasMorningSession,
            hasMiddaySession,
            hasEveningSession,
            morningSession,
            middaySession,
            eveningSession
        };
    } catch (err) {
        console.error('Error loading dashboard data:', err);
        throw error(500, 'Failed to load dashboard data');
    }
};

// Function to determine time of day using user's timezone
function getTimeOfDay(timezoneOffset: number = 0): string {
    const now = new Date();
    const userDate = adjustToUserTimezone(now, timezoneOffset);
    return getTimeOfDayFromHour(userDate.getHours());
}

// Check if user has sessions for different times of day, accounting for timezone
function checkTimedSessions(meditations: any[], timezoneOffset: number = 0) {
    let hasMorningSession = false;
    let hasMiddaySession = false;
    let hasEveningSession = false;
    let morningSession = null;
    let middaySession = null;
    let eveningSession = null;

    if (!meditations || meditations.length === 0) {
        return {
            hasMorningSession,
            hasMiddaySession,
            hasEveningSession,
            morningSession,
            middaySession,
            eveningSession
        };
    }

    // Adjust dates for user's timezone
    const today = new Date();
    const userToday = adjustToUserTimezone(today, timezoneOffset);
    userToday.setHours(0, 0, 0, 0);

    // Reset at 3am - consider anything after 3am today, and before 3am as today
    const resetTime = new Date(userToday);
    resetTime.setHours(3, 0, 0, 0);

    const todaySessions = meditations.filter(med => {
        const serverSessionDate = new Date(med.created_at);
        const userSessionDate = adjustToUserTimezone(serverSessionDate, timezoneOffset);
        const userCurrentHour = adjustToUserTimezone(new Date(), timezoneOffset).getHours();

        // If current time is before 3am, include sessions from yesterday after 3am
        if (userCurrentHour < 3) {
            const yesterdayReset = new Date(resetTime);
            yesterdayReset.setDate(yesterdayReset.getDate() - 1);
            return userSessionDate >= yesterdayReset;
        }

        // Otherwise just include sessions after 3am today
        return userSessionDate >= resetTime;
    });

    // Find latest session for each time of day
    const morningMeditations = todaySessions.filter(med => {
        const serverSessionDate = new Date(med.created_at);
        const userSessionDate = adjustToUserTimezone(serverSessionDate, timezoneOffset);
        const hour = userSessionDate.getHours();
        return hour >= 3 && hour < 12;
    });

    const middayMeditations = todaySessions.filter(med => {
        const serverSessionDate = new Date(med.created_at);
        const userSessionDate = adjustToUserTimezone(serverSessionDate, timezoneOffset);
        const hour = userSessionDate.getHours();
        return hour >= 12 && hour < 17;
    });

    const eveningMeditations = todaySessions.filter(med => {
        const serverSessionDate = new Date(med.created_at);
        const userSessionDate = adjustToUserTimezone(serverSessionDate, timezoneOffset);
        const hour = userSessionDate.getHours();
        return hour >= 17 || hour < 3;
    });

    hasMorningSession = morningMeditations.length > 0;
    hasMiddaySession = middayMeditations.length > 0;
    hasEveningSession = eveningMeditations.length > 0;

    // Get the most recent session for each time period
    if (hasMorningSession) {
        morningSession = morningMeditations.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }

    if (hasMiddaySession) {
        middaySession = middayMeditations.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }

    if (hasEveningSession) {
        eveningSession = eveningMeditations.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }

    return {
        hasMorningSession,
        hasMiddaySession,
        hasEveningSession,
        morningSession,
        middaySession,
        eveningSession
    };
} 