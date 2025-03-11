import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';
import { supabaseAdmin, getPlaylists, getPlaylist } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;

	if (!session) {
		console.log('No session found, redirecting to login');
		throw redirect(302, '/login');
	}

	const playlistId = url.searchParams.get('playlist');

	try {
		// Only fetch visible playlists for the dropdown
		const playlists = await getPlaylists(false);

		let selectedPlaylist = null;
		let initialTab = 'custom';

		if (playlistId) {
			initialTab = 'lesson';
			if (playlistId !== '') {
				// Only fetch visible playlist for selection
				try {
					const playlist = await getPlaylist(playlistId, false);
					if (playlist) {
						selectedPlaylist = playlist;
					}
				} catch (err) {
					console.error('Error fetching selected playlist:', err);
					// If playlist is not found or not visible, we'll leave selectedPlaylist as null
				}
			}
		}

		return {
			session,
			playlists,
			selectedPlaylist,
			initialTab
		};
	} catch (err) {
		console.error('Error fetching data:', err);
		throw error(500, 'Error fetching data');
	}
};

export const actions: Actions = {
	generateMeditation: async ({ request, locals }) => {
		const { session } = locals;

		if (!session) {
			throw error(401, 'Unauthorized');
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

			return {
				type: 'success',
				data: {
					meditation_id: result.data.meditation_id
				}
			};
		} catch (err) {
			console.error('Server: Meditation generation error:', err);
			return {
				type: 'error',
				message: 'An error occurred while generating the meditation. Please try again.'
			};
		}
	}
};