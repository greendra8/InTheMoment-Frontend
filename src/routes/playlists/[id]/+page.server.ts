import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPlaylist, getPlaylistLessons, getUserProgress } from '$lib/server/supabase';
import { getDeterministicBgPattern } from '$lib/utils/backgroundPatterns';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const playlistId = params.id;
    const userId = locals.user?.id;

    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    // Only fetch visible playlists
    const playlist = await getPlaylist(playlistId, false);

    if (!playlist) {
      throw error(404, 'Playlist not found');
    }

    // Add background pattern to the playlist
    const playlistWithBackground = {
      ...playlist,
      bgPattern: getDeterministicBgPattern(playlist)
    };

    // Only fetch visible lessons
    const lessons = await getPlaylistLessons(playlistId, userId, false);
    const completedLessons = await getUserProgress(userId, playlistId);

    // Find the first lesson that hasn't been generated yet
    const nextLessonToGenerate = lessons.find(lesson => !lesson.hasGenerated)?.lesson_number || null;

    // Calculate total visible lessons for progress
    const totalVisibleLessons = lessons.filter(lesson => lesson.visible).length;

    // Calculate completed visible lessons
    const completedVisibleLessons = lessons
      .filter(lesson => lesson.visible && completedLessons.includes(lesson.lesson_number))
      .length;

    return {
      playlist: playlistWithBackground,
      lessons,
      completedLessons,
      nextLessonToGenerate,
      progress: {
        completed: completedVisibleLessons,
        total: totalVisibleLessons
      }
    };
  } catch (err) {
    console.error('Error fetching playlist and lessons:', err);
    if (err instanceof Error && 'status' in err && err.status === 404) {
      throw error(404, 'Playlist not found');
    }
    throw error(500, 'Error fetching playlist and lessons');
  }
};