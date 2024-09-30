import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

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
		const { session } = await locals.safeGetSession();

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const experienceLevel = formData.get('experienceLevel') as string;

		try {
			const updatedProfile = await updateUserProfile(session.user.id, { name, experience: experienceLevel });
      return { success: true, profile: updatedProfile };
		} catch (err) {
			console.error('Error updating user profile:', err);
			return fail(500, { message: 'Failed to update profile' });
		}
	}
};