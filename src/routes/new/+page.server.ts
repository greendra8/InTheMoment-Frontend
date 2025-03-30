import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';
import { getPlaylists, getPlaylist, getUserMeditations, getPlaylistWithConstraints } from '$lib/server/supabase';
import { TIMEZONE_OFFSET_COOKIE, adjustToUserTimezone } from '$lib/utils/time'; // Import time utils

// Cookie name for pre-session data
const PRE_SESSION_COOKIE_NAME = 'pre_session_data';

// List of possible initial questions for the pre-session dialog - separated by time
const morningQuestions = [
	'What are your plans for today?',
	"What's on your mind this morning?",
	"How are you feeling right now?"
];

const middayQuestions = [
	"What have you been up to today?",
	"How are you feeling this afternoon?",
	"How has your day been going so far?",
	"What's on your mind this afternoon?",
	"How are things going?"
];

const eveningQuestions = [
	"What have you been up to today?",
	"How are you feeling this evening?",
	"What's on your mind tonight?",
	"How are things going?"
];

// Type definition for time of day
type TimeOfDay = 'morning' | 'midday' | 'evening';

// Function to determine time of day using user's timezone, resetting at 4 am
function getCurrentTimeOfDay(timezoneOffset: number = 0): TimeOfDay {
	const now = new Date();
	const userDate = adjustToUserTimezone(now, timezoneOffset);
	const hour = userDate.getHours();

	if (hour >= 4 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 17) return 'midday';
	// Evening covers 5pm (17) up to 3:59am (exclusive of 4)
	return 'evening';
}

// Function to get a random question based on the time of day
function getRandomQuestion(timeOfDay: TimeOfDay): string {
	let questionList: string[];

	// Select the appropriate list based on time of day
	if (timeOfDay === 'morning') {
		questionList = morningQuestions;
	} else if (timeOfDay === 'midday') {
		questionList = middayQuestions;
	} else {
		questionList = eveningQuestions;
	}

	const randomIndex = Math.floor(Math.random() * questionList.length);
	return questionList[randomIndex];
}

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const { session, user } = locals;

	// Auth checks are now handled in hooks.server.ts
	if (!user) {
		throw error(500, 'User not available in locals');
	}

	const playlistId = url.searchParams.get('playlist');
	const configureMode = url.searchParams.has('configure');

	// Check if we should load pre-session data from cookies
	let preSessionData = null;
	let hasPreviousCheckIn = false;
	const preSessionCookie = cookies.get(PRE_SESSION_COOKIE_NAME);

	if (preSessionCookie) {
		try {
			preSessionData = JSON.parse(preSessionCookie);
			hasPreviousCheckIn = true;
		} catch (err) {
			console.error('Server: Error parsing pre-session cookie data:', err);
			// If there's an error parsing, delete the cookie
			cookies.delete(PRE_SESSION_COOKIE_NAME, { path: '/' });
		}
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
				// Keep default offset of 0 if parsing fails
			}
		}

		// Determine current time of day based on user's timezone
		const currentTimeOfDay = getCurrentTimeOfDay(timezoneOffset);

		// Only fetch visible playlists for the dropdown
		const playlists = await getPlaylists(20, false);

		// Fetch user's meditations to determine if this is their first session
		const { data: meditations, totalCount: totalMeditations } = await getUserMeditations(user.id);

		let selectedPlaylist = null;
		let initialTab = 'custom';

		if (playlistId) {
			initialTab = 'lesson';
			if (playlistId !== '') {
				// Use the new function that fetches playlist with constraints
				try {
					const playlistWithConstraints = await getPlaylistWithConstraints(playlistId, user.id, false);
					if (playlistWithConstraints) {
						selectedPlaylist = playlistWithConstraints;
					}
				} catch (err) {
					console.error('Error fetching selected playlist with constraints:', err);
					// If playlist is not found or not visible, we'll leave selectedPlaylist as null
				}
			}
		}

		// Generate a random question on the server based on the time of day
		const initialQuestion = getRandomQuestion(currentTimeOfDay);

		return {
			playlists,
			selectedPlaylist,
			initialTab,
			meditations,
			totalMeditations,
			initialQuestion, // Add the initial question to the returned data
			preSessionData, // Add the pre-session data from cookies if available
			hasPreviousCheckIn, // Add flag indicating if previous check-in data exists
			configureMode, // Add flag indicating if we're in configure mode
			currentTimeOfDay // Add current time of day to the returned data
		};
	} catch (err) {
		console.error('Error fetching data:', err);
		throw error(500, 'Error fetching data');
	}
};

export const actions: Actions = {
	generateMeditation: async ({ request, locals, cookies }) => {
		const { session, user } = locals;

		// Auth checks are now handled in hooks.server.ts
		if (!user || !session) {
			throw error(500, 'User or session not available in locals');
		}

		const data = await request.formData();
		const userLocalTime = data.get('userLocalTime') as string;
		const length = parseInt(data.get('length') as string);
		const parameters = JSON.parse(data.get('parameters') as string);
		const content_type = data.get('content_type') as string || 'meditation';

		// Get playlist_id if it exists
		let playlist_id: number | undefined;
		const playlistIdStr = data.get('playlist_id') as string;
		if (playlistIdStr) {
			playlist_id = parseInt(playlistIdStr);
		}

		console.log('Server: Received parameters:', {
			userLocalTime,
			length,
			parameters,
			content_type,
			playlist_id
		});

		try {
			// Verify the playlist is visible if one is specified
			if (playlist_id) {
				const playlist = await getPlaylist(playlist_id.toString(), false);
				if (!playlist) {
					return {
						type: 'error',
						message: 'Selected playlist is not available.'
					};
				}
			}

			console.log('Server: Calling generateMeditation');
			const result = await generateMeditation(
				session.access_token,
				length,
				userLocalTime,
				parameters,
				playlist_id,
				content_type
			);

			console.log('Server: Result from generateMeditation:', JSON.stringify(result, null, 2));

			cookies.delete(PRE_SESSION_COOKIE_NAME, { path: '/' });

			// On success, return the success object as before
			return {
				type: 'success',
				data: {
					meditation_id: result.data.meditation_id
				}
			};
		} catch (err: unknown) {
			console.error('Server: Meditation generation error:', err);

			let errorMessage = 'An error occurred while generating the meditation. Please try again.';
			let errorStatus = 500; // Default status

			if (err instanceof Error) {
				errorMessage = err.message;
				// Check if the custom status property exists from pythonApi.ts
				if ((err as any).status) {
					errorStatus = (err as any).status;
				}
			}

			// Instead of returning, THROW a SvelteKit error
			// This will send a proper HTTP error response (e.g., 429, 500)
			throw error(errorStatus, errorMessage);
		}
	}
};