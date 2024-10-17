import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserProfile } from '$lib/server/supabase';
import { updateUserProfile } from '$lib/api';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const profile = await getUserProfile(session.user.id);
		return { profile, session };
	} catch (err) {
		throw error(500, 'Failed to load user profile');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session } = locals;

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const experience = formData.get('experience') as string;
		const voice_id = parseInt(formData.get('voice_id') as string);

		try {
			const updatedProfile = await updateUserProfile(session.user.id, {
				name,
				experience,
				voice_id
			});

			// Return a success response
			return {
				type: 'success',
				data: { profile: updatedProfile }
			};
		} catch (err) {
			console.error('Error updating user profile:', err);

			// Return an error response
			return fail(500, { type: 'error', error: 'Failed to update profile' });
		}
	}
};
