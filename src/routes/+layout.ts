import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import type { LayoutLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { isUserProfileComplete } from '$lib/supabase'

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const load: LayoutLoad = async ({ data, depends, fetch, url }) => {
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies
          },
        },
      })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const isComplete = await isUserProfileComplete(session.user.id)
    if (!isComplete && url.pathname !== '/profile-setup') {
      throw redirect(303, '/profile-setup')
    }
  }

  return { ...data, supabase, session }
}