// +layout.ts
import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends }) => {
  depends('supabase:auth');

  if (data.session) {
    supabase.auth.setSession(data.session);
  }

  return { ...data };
};