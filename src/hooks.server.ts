import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase: Handle = async ({ event, resolve }) => {
  const headersToLog = ['user-agent', 'authorization', 'x-custom-header'];
  const loggedHeaders = headersToLog.reduce((acc, header) => {
    acc[header] = event.request.headers.get(header);
    return acc;
  }, {});
  console.log('Relevant incoming headers:', loggedHeaders);

  // Log all cookies
  const allCookies = event.request.headers.get('cookie');
  console.log('All cookies:', allCookies);

  // Log specific Supabase cookies
  console.log('Access token cookie:', event.cookies.get('sb-access-token'));
  console.log('Refresh token cookie:', event.cookies.get('sb-refresh-token'));

  // Log the full cookie string
  console.log('Full cookie string:', event.request.headers.get('cookie'));

  // Log individual Supabase-related cookies
  console.log('sb-access-token:', event.cookies.get('sb-access-token'));
  console.log('sb-refresh-token:', event.cookies.get('sb-refresh-token'));

  // Log the origin of the request
  console.log('Request origin:', event.request.headers.get('origin'));

  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => {
        console.log('Getting cookie:', key);
        if (key.endsWith('-auth-token')) {
          // Construct the auth token from separate cookies
          const accessToken = event.cookies.get('sb-access-token');
          const refreshToken = event.cookies.get('sb-refresh-token');
          if (accessToken && refreshToken) {
            // Decode the access token to get user information
            const [, payload] = accessToken.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            const constructedAuthToken = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: decodedPayload.exp * 1000, // Convert to milliseconds
              user: {
                id: decodedPayload.sub,
                email: decodedPayload.email,
                // Add other user properties as needed
              }
            };
            console.log('Constructed auth token:', constructedAuthToken);
            return JSON.stringify(constructedAuthToken);
          }
        }
        // For other keys, return the actual cookie value
        const value = event.cookies.get(key);
        console.log(`Getting cookie ${key}:`, value);
        return value;
      },
      set: (key, value, options) => {
        console.log(`Setting cookie ${key}:`, value, options);
        event.cookies.set(key, value, {
          ...options,
          secure: event.url.protocol === "https:"
        })
      },
      remove: (key, options) => {
        console.log(`Removing cookie ${key}:`, options);
        event.cookies.delete(key, {
          ...options,
          secure: event.url.protocol === "https:"
        })
      },
    },
  })

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    console.log('Raw session data:', session);
    if (!session) {
      console.log('No session found');
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    console.log('User from getUser:', user);
    console.log('Error from getUser:', error);
    if (error) {
      console.error('JWT validation failed:', error);
      return { session: null, user: null }
    }

    // Ensure the session object has the correct structure
    const validSession = {
      ...session,
      user: user // Make sure user is included in the session
    };

    return { session: validSession, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  console.log('Session from safeGetSession:', session);
  console.log('User from safeGetSession:', user);
  event.locals.session = session;
  event.locals.user = user;

  // Add meditation to protected routes
  if (!session && (event.url.pathname.startsWith('/private') || event.url.pathname.startsWith('/dashboard') || event.url.pathname.startsWith('/meditation'))) {
    console.log('Redirecting to login due to no session');
    throw redirect(303, '/login');
  }

  if (session && event.url.pathname === '/auth') {
    console.log('Redirecting to private due to existing session');
    throw redirect(303, '/private');
  }

  return resolve(event);
}

export const handle: Handle = sequence(supabase, authGuard)