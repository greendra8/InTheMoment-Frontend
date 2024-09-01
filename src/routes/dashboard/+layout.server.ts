import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    throw redirect(303, '/login');
  }

  const { data: { user }, error: userError } = await locals.supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user:', userError);
    throw redirect(303, '/login');
  }

  return {
    user,
    session
  };
};
