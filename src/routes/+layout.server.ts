import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();

  // Redirect to dashboard if user is logged in and trying to access the home page
  if (session && url.pathname === '/') {
    throw redirect(302, '/dashboard');
  }

  // Generate the navigation menu structure based on the session
  const navItems = session
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/meditation', label: 'Meditation' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Register' },
      ];

  return {
    session,
    navItems,
    cookies: locals.cookies,
  };
};