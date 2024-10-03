import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;

	if (!session) {
		console.log('No session found, redirecting to login');
		throw redirect(302, '/login');
	}

	const playlistId = url.searchParams.get('playlist');

	try {
		const { data: playlists, error: playlistsError } = await supabaseAdmin
			.from('lesson_playlists')
			.select('id, playlist_name')
			.order('playlist_order');

		if (playlistsError) throw playlistsError;

		let selectedPlaylist = null;
		let initialTab = 'custom';

		if (playlistId) {
			initialTab = 'lesson';
			if (playlistId !== '') {
				const { data: playlist, error: playlistError } = await supabaseAdmin
					.from('lesson_playlists')
					.select('id, playlist_name')
					.eq('id', playlistId)
					.single();

				if (!playlistError && playlist) {
					selectedPlaylist = playlist;
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
		const playlist_id = data.get('playlist_id') as string;

		console.log('Server: Received form data:', { userLocalTime, length, parameters, playlist_id });

		try {
			console.log('Server: Calling generateMeditation');
			const result = await generateMeditation(
				session.access_token,
				length,
				userLocalTime,
				parameters,
				playlist_id
			);

			console.log('Server: Result from generateMeditation:', JSON.stringify(result, null, 2));

			// Ensure we're returning a plain object
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