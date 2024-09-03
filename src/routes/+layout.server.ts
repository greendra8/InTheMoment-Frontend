import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();

  // Redirect to dashboard if user is logged in and trying to access the home page
  if (session && url.pathname === '/') {
    throw redirect(302, '/dashboard');
  }

  return {
    session,
    cookies: locals.cookies,
  };
};