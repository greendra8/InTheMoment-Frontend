import { json, error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { generateMeditation } from '$lib/pythonApi';
import { supabase } from '$lib/supabaseClient';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;

	if (!session) {
		console.log('No session found, redirecting to login');
		throw redirect(302, '/login');
	}

	try {
		const { data: playlists, error: playlistsError } = await supabaseAdmin
			.from('lesson_playlists')
			.select('id, playlist_name')
			.order('playlist_order');

		if (playlistsError) throw playlistsError;


		return {
			session,
			playlists
		};
	} catch (err) {
		console.error('Error fetching playlists:', err);
		throw error(500, 'Error fetching playlists');
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
		const playlist_id = parseInt(data.get('playlist_id') as string);

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