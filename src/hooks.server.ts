import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => {
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
                email: decodedPayload.email,
              }
            });
          }
        }
        return event.cookies.get(key);
      },
      set: (key, value, options) => {
        event.cookies.set(key, value, {
          ...options,
          secure: event.url.protocol === "https:"
        })
      },
      remove: (key, options) => {
        event.cookies.delete(key, {
          ...options,
          secure: event.url.protocol === "https:"
        })
      },
    },
  })

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) {
      console.error('JWT validation failed:', error);
      return { session: null, user: null }
    }

    return { session: { ...session, user }, user }
  }

  event.locals.isNativeApp = event.request.headers.get('X-Native-App') === 'true';

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  if (!session && (event.url.pathname.startsWith('/private') || event.url.pathname.startsWith('/dashboard') || event.url.pathname.startsWith('/meditation'))) {
    throw redirect(303, '/login');
  }

  if (session && event.url.pathname === '/auth') {
    throw redirect(303, '/private');
  }

  return resolve(event);
}

export const handle: Handle = sequence(supabase, authGuard)