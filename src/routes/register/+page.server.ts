import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { validateEmail, validatePassword } from '$lib/utils/validation';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const emailError = validateEmail(email);
    if (emailError) {
      return fail(400, { email, message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return fail(400, { email, message: passwordError });
    }

    const { data, error: err } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      if (err instanceof AuthApiError && err.status === 400) {
        return fail(400, { email, message: 'Registration failed. Please check your details.' });
      }
      console.error('[Register Action] SignUp error:', err.message);
      return fail(500, { email, message: 'Server error. Please try again later.' });
    }

    if (data?.user?.identities?.length === 0) {
      return { email, success: 'Please check your email to verify your account.' };
    }

    throw redirect(303, '/dashboard');
  }
};