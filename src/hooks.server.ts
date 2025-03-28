// hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { getUserProfile } from '$lib/server/supabase';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => {
        // Native app cookie handling (if applicable)
        if (key.endsWith('-auth-token')) {
          const accessToken = event.cookies.get('sb-access-token');
          const refreshToken = event.cookies.get('sb-refresh-token');
          if (accessToken && refreshToken) {
            const [, payload] = accessToken.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            return JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: decodedPayload.exp * 1000,
              user: {
                id: decodedPayload.sub,
                email: decodedPayload.email
              }
            });
          }
        }
        return event.cookies.get(key);
      },
      set: (key, value, options) => {
        event.cookies.set(key, value, {
          ...options,
          path: options?.path || '/',
          secure: event.url.protocol === 'https:'
        });
      },
      remove: (key, options) => {
        event.cookies.delete(key, {
          ...options,
          path: options?.path || '/',
          secure: event.url.protocol === 'https:'
        });
      }
    }
  });

  const isNativeApp = event.request.headers.get('X-Native-App') === 'true';

  if (isNativeApp) {
    event.cookies.set('is_native_app', 'true', {
      path: '/',
      httpOnly: true,
      secure: !dev,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
  }

  event.locals.isNativeApp = isNativeApp || event.cookies.get('is_native_app') === 'true';

  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      // JWT validation failed or other error
      return { session: null, user: null };
    }

    return { session: { ...session, user }, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  // Fetch user profile once and store in locals if user is logged in
  if (session?.user) {
    try {
      const profile = await getUserProfile(session.user.id);
      event.locals.profile = profile;
      event.locals.session = { ...session, profile } as typeof session;
    } catch (error: any) {
      console.error('[Hooks] Error fetching user profile:', error.message);
    }
  }

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/auth/callback', // Supabase auth callback
    '/reset-password' // Allow access to the password reset page
  ];

  // Check if the current path is NOT public AND the user is not logged in
  if (!publicPaths.includes(event.url.pathname) && !session) {
    // Protect non-public routes
    if (!event.url.pathname.startsWith('/api')) { // Example: Allow API routes maybe? Adjust as needed.
      throw redirect(303, '/login');
    }
  }

  return resolve(event);
};
export const handle: Handle = sequence(supabase, authGuard);