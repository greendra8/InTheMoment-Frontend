import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
    const code = url.searchParams.get('code');

    // Security: Don't log the full URL as it contains sensitive information
    console.log('[Auth Callback] Processing authentication callback');

    if (!code) {
        console.error('[Auth Callback] Missing code parameter');
        throw redirect(303, '/login?error=invalid_callback');
    }

    try {
        const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Authentication error');
            throw redirect(303, '/login?error=auth_error');
        }

        if (!data.session) {
            console.error('[Auth Callback] No session returned');
            throw redirect(303, '/login?error=no_session');
        }

        // Success - redirect to dashboard
        throw redirect(303, '/dashboard');
    } catch (e) {
        console.error('[Auth Callback] Exception during authentication');
        throw redirect(303, '/login?error=server_error');
    }
}; 