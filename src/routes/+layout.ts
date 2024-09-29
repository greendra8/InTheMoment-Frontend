// +layout.ts
import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import { isBrowser } from '@supabase/ssr';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth');

  if (isBrowser() && data.session) {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (data.session.expires_at !== currentSession?.expires_at) {
      supabase.auth.setSession(data.session);
    }
  }

  return { ...data };
};