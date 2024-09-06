import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    cookieOptions: {
      // DEVELOPMENT ONLY: This allows cookies to be set over HTTP for local development.
      // IMPORTANT: For production, remove this option to ensure cookies are always secure.
      secure: window.location.protocol === "https:"
    }
  }
})