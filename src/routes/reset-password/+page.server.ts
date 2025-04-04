import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AuthApiError } from '@supabase/supabase-js';
import { validatePassword } from '$lib/utils/validation'; // Import validation function

// --- LOAD Function ---
export const load: PageServerLoad = async ({ url, locals }) => {
    const code = url.searchParams.get('code');
    const session = locals.session;

    if (session) {
        // If user is already logged in normally, block access.
        return { codePresent: false, isLoggedIn: true, error: 'Please use account settings to change your password.' };
    }

    if (!code) {
        return { codePresent: false, isLoggedIn: false, error: 'Invalid or missing password reset link.' };
    }

    // Pass the code, allowing page render for logged-out users with a code.
    return { codePresent: true, code: code, isLoggedIn: false, error: null };
};

// --- ACTIONS ---
export const actions: Actions = {
    // Default action triggered by the form post
    default: async ({ request, locals }) => {
        const formData = await request.formData();
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const code = formData.get('code') as string; // Get code from hidden form field

        // Basic validation
        if (!code) {
            return fail(400, { message: 'Verification code is missing. Please use the link from your email again.' });
        }

        // --- Password Validation ---
        const passwordError = validatePassword(password);
        if (passwordError) {
            return fail(400, { message: passwordError, code });
        }
        if (password !== confirmPassword) {
            return fail(400, { message: 'Passwords do not match.', code });
        }
        // --- End Validation ---

        try {
            // 1. Exchange the code - This verifies the code
            const { data: exchangeData, error: exchangeError } =
                await locals.supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                let userMessage = 'Failed to verify password reset link.';
                if (
                    exchangeError.message.includes('invalid_grant') ||
                    exchangeError.message.includes('expired') ||
                    exchangeError.message.includes('code verifier') ||
                    exchangeError.message.includes('used') // Catch already used
                ) {
                    userMessage =
                        'Password reset link is invalid, expired, or already used. Please request a new one.';
                }
                console.warn('[Reset Password Action] Code exchange error:', exchangeError.message);
                return fail(401, { message: userMessage });
            }

            // 2. Update the password - Uses the implicit auth state from the successful exchange
            const { error: updateError } = await locals.supabase.auth.updateUser({ password });

            if (updateError) {
                console.error('[Reset Password Action] Password update error:', updateError.message);
                return fail(500, { message: `Password update failed: ${updateError.message}` });
            }

            // 3. Sign out immediately after successful update
            const { error: signOutError } = await locals.supabase.auth.signOut();

            if (signOutError) {
                // Log server-side if needed, but don't block user success
                console.warn('[Reset Password Action] Failed to sign out after password update:', signOutError.message);
            }

            // 4. Return success to the client
            return {
                success: true,
                message: 'Password updated successfully!'
            };
        } catch (e: any) {
            console.error('[Reset Password Action] Unexpected exception:', e);
            return fail(500, { message: 'An unexpected server error occurred.' });
        }
    }
}; 