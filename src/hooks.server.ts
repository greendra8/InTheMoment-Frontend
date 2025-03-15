// hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => {
        if (key.endsWith('-auth-token')) { // This is true for native webview app
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
                email: decodedPayload.email,
              },
            });
          }
        }
        return event.cookies.get(key);
      },
      set: (key, value, options) => {
        // Fix TypeScript error by ensuring path is always provided
        event.cookies.set(key, value, {
          path: '/',  // Default path
          ...options,
          secure: event.url.protocol === 'https:',
        });
      },
      remove: (key, options) => {
        // Fix TypeScript error by ensuring path is always provided
        event.cookies.delete(key, {
          path: '/',  // Default path
          ...options,
          secure: event.url.protocol === 'https:',
        });
      },
    },
  });

  const isNativeApp = event.request.headers.get('X-Native-App') === 'true';

  if (isNativeApp) {
    event.cookies.set('is_native_app', 'true', {
      path: '/',
      httpOnly: true,
      secure: !dev,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });
  }

  event.locals.isNativeApp = isNativeApp || event.cookies.get('is_native_app') === 'true';

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  // First check if we have a session cookie to avoid unnecessary API calls
  const hasSessionCookie = event.cookies.get('sb-access-token') ||
    event.cookies.get('sb-refresh-token') ||
    event.cookies.get('supabase-auth-token');

  // If we're on a public route and don't have a session cookie, skip auth check
  const isPublicRoute = event.url.pathname === '/' ||
    event.url.pathname === '/login' ||
    event.url.pathname === '/register';

  if (isPublicRoute && !hasSessionCookie) {
    // Set null values for auth-related locals
    event.locals.session = null;
    event.locals.user = null;
    event.locals.profile = null;

    // Skip further auth checks for public routes without session
    return resolve(event);
  }

  // Get session from Supabase only if we have a session cookie or need auth
  const {
    data: { session },
  } = await event.locals.supabase.auth.getSession();

  // If no session, set null values and check for public routes
  if (!session) {
    event.locals.session = null;
    event.locals.user = null;
    event.locals.profile = null;

    // Only allow access to public routes when not authenticated
    if (!isPublicRoute) {
      throw redirect(303, '/login');
    }
  } else {
    // We have a session, validate/refresh it and get user profile in parallel
    try {
      // Get user to validate/refresh token, but only if session might be stale
      // This helps maintain the session while minimizing API calls
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      const needsRefresh = sessionAge > 1800000; // 30 minutes

      const [userResult, profileResult] = await Promise.all([
        // Only fetch user (which refreshes token) if needed
        needsRefresh ? event.locals.supabase.auth.getUser() : Promise.resolve({ data: { user: session.user }, error: null }),
        // Fetch user profile
        event.locals.supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
      ]);

      if (userResult.error) {
        console.error('Session validation failed:', userResult.error);
        throw userResult.error;
      }

      const user = userResult.data.user;
      const profile = profileResult.data;

      // Store everything in locals for easy access in routes
      event.locals.session = session;
      event.locals.user = user;
      event.locals.profile = profile;

      // Handle redirects based on profile status
      const isComplete = profile?.complete || false;
      const isAdmin = user.id === 'cf39c581-6b6f-44b7-8c56-f7f64a26637c';

      // Redirect to profile setup if profile is incomplete
      if (!isComplete && event.url.pathname !== '/profile-setup') {
        throw redirect(303, '/profile-setup');
      }

      // Redirect logged-in users from public routes to dashboard
      if (isPublicRoute) {
        throw redirect(303, '/dashboard');
      }

      // Only allow admin user to access admin routes
      if (event.url.pathname.startsWith('/admin') && !isAdmin) {
        throw redirect(303, '/dashboard');
      }
    } catch (error) {
      console.error('Error in auth guard:', error);
      // If there's an error fetching the profile, we'll still allow the request
      // but with null profile
      event.locals.session = session;
      event.locals.user = session.user;
      event.locals.profile = null;
    }
  }

  return resolve(event);
};

// Update the sequence to remove the cache control handler
export const handle: Handle = sequence(supabase, authGuard);
