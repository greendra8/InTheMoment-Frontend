import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { submitUserContext, isUserProfileComplete } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession();

	if (!session) {
		throw redirect(302, '/login');
	}

	// Check if the user's profile is already complete
	const isComplete = await isUserProfileComplete(session.user.id);
	if (isComplete) {
		throw redirect(302, '/dashboard');
	}

	return {
		user: session.user
	};
};

export const actions: Actions = {
	submitProfile: async ({ request, locals }) => {
		const session = await locals.safeGetSession();

		if (!session) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const profileData = {
			name: formData.get('name') as string,
			dob: formData.get('dob') as string,
			gender: formData.get('gender') as string,
			experience: formData.get('experience') as string,
			preferences: JSON.parse(formData.get('preferences') as string),
		};

		try {
			await submitUserContext(session.user.id, profileData);
			return { success: true };
		} catch (err) {
			console.error('Profile submission error:', err);
			return { success: false, error: 'An error occurred while saving your profile. Please try again.' };
		}
	}
};