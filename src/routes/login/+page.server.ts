import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { validateEmail, validatePassword } from '$lib/utils/validation';

export const actions: Actions = {
  login: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const useMagicLink = formData.get('magicLink') === 'true';

    // --- Email Validation (Always required) ---
    const emailError = validateEmail(email);
    if (emailError) {
      return fail(400, { email, useMagicLink, message: emailError });
    }

    // Handle magic link login
    if (useMagicLink) {
      const { error } = await locals.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${url.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('[Login Action] Magic link error:', error.message);
        return fail(500, { email, useMagicLink, message: 'Unable to send magic link. Please try again later.' });
      }

      return {
        email, useMagicLink, success: 'Check your email for the magic link!'
      };
    }

    // Handle password login
    if (!password) {
      return fail(400, { email, useMagicLink, message: 'Password is required' });
    }

    // --- Password Validation ---
    const passwordError = validatePassword(password);
    if (passwordError) {
      return fail(400, { email, useMagicLink, message: passwordError });
    }

    const { data, error: err } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (err) {
      if (err instanceof AuthApiError && err.status === 400) {
        return fail(400, { email, useMagicLink, message: 'Invalid credentials' });
      }
      console.error('[Login Action] Login error:', err.message);
      return fail(500, { email, useMagicLink, message: 'Server error. Please try again later.' });
    }

    throw redirect(303, '/dashboard');
  },

  // Action for password reset request
  resetPassword: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    // --- Email Validation ---
    const emailError = validateEmail(email);
    if (emailError) {
      return fail(400, { resetEmail: email, resetError: emailError });
    }

    const redirectToUrl = `${url.origin}/reset-password`;

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl
    });

    if (error) {
      // Don't reveal if email exists, log server-side only
      console.error('[Reset Password Action] Error sending reset email:', error.message);
    }

    // Always return generic success message for security
    return {
      resetEmail: email,
      resetSuccess: 'If an account exists for this email, a password reset link has been sent.'
    };
  }
};