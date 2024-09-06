import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();

  // Redirect to login if user is not authenticated and trying to access a protected route
  if (!session && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/meditation'))) {
    throw redirect(303, '/login');
  }

  // Generate the navigation menu structure based on the session
  const navItems = session
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: 'fa-home' },
        { href: '/meditation', label: 'Meditation', icon: 'fa-spa' },
        { href: '/profile', label: 'Profile', icon: 'fa-user' },
      ]
    : [
        { href: '/', label: 'Home', icon: 'fa-home' },
        { href: '/login', label: 'Login', icon: 'fa-sign-in-alt' },
        { href: '/register', label: 'Register', icon: 'fa-user-plus' },
      ];

  return {
    session,
    navItems,
    cookies: locals.cookies,
  };
};