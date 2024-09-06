import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      set: (key, value, options) => {
        event.cookies.set(key, value, {
          ...options,
          // DEVELOPMENT ONLY: This allows cookies to be set over HTTP for local development.
          // IMPORTANT: For production, change this to always be true:
          // secure: true
          secure: event.url.protocol === "https:"
        })
      },
      remove: (key, options) => {
        event.cookies.delete(key, {
          ...options,
          // DEVELOPMENT ONLY: This allows cookies to be set over HTTP for local development.
          // IMPORTANT: For production, change this to always be true:
          // secure: true
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
    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }

    return { session, user }
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
  event.locals.session = session;
  event.locals.user = user;

  // Add meditation to protected routes
  if (!session && (event.url.pathname.startsWith('/private') || event.url.pathname.startsWith('/dashboard') || event.url.pathname.startsWith('/meditation'))) {
    throw redirect(303, '/login');
  }

  if (session && event.url.pathname === '/auth') {
    throw redirect(303, '/private');
  }

  return resolve(event);
}

export const handle: Handle = sequence(supabase, authGuard)