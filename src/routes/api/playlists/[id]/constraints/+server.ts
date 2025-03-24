import { json, error } from '@sveltejs/kit';
import { getPlaylistWithConstraints } from '$lib/server/supabase';

export async function GET({ params, locals }) {
    try {
        const { session, user } = locals;

        // Auth checks - user must be authenticated
        if (!user) {
            throw error(401, 'Unauthorized');
        }

        const playlistId = params.id;
        if (!playlistId) {
            throw error(400, 'Playlist ID is required');
        }

        // Get the playlist constraints
        const playlistWithConstraints = await getPlaylistWithConstraints(playlistId, user.id, false);

        // Return only the constraint information to avoid exposing unnecessary data
        return json({
            eyesConstraint: playlistWithConstraints.eyesConstraint,
            postureConstraint: playlistWithConstraints.postureConstraint,
            nextLessonId: playlistWithConstraints.nextLessonId
        });
    } catch (err) {
        console.error('Error fetching playlist constraints:', err);
        throw error(500, 'Error fetching playlist constraints');
    }
} 