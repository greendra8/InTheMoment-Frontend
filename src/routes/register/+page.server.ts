import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { session as sessionStore } from '$lib/stores/session';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return fail(400, { message: 'Email and password are required' });
    }

    const { data, error: err } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      if (err instanceof AuthApiError && err.status === 400) {
        return fail(400, { message: 'Invalid email or password' });
      }
      return fail(500, { message: 'Server error. Please try again later.' });
    }

    // Set the session in the store
    sessionStore.set(data.session);

    // Check if user needs to verify their email
    if (data?.user?.identities?.length === 0) {
      return { message: 'Please check your email to verify your account' };
    }

    throw redirect(303, '/dashboard');
  }
};