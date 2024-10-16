import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/server/supabase';
import { updateUserProfile } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

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
	updateProfile: async ({ request, locals }) => {
		const { session } = locals;

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const experience = formData.get('experience') as string;
		const voice_id = parseInt(formData.get('voice_id') as string);

		try {
			const updatedProfile = await updateUserProfile(session.user.id, { name, experience, voice_id });
			return { success: true, profile: updatedProfile };
		} catch (err) {
			console.error('Error updating user profile:', err);
			return fail(500, { message: 'Failed to update profile' });
		}
	}
};
