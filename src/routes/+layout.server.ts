import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();

  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/meditation'))) {
    throw redirect(303, '/login');
  }

  const navItems = user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: 'fa-home' },
        { href: '/list', label: 'List', icon: 'fa-list' },
        { href: '/meditation', label: 'Meditation', icon: 'fa-spa' },
        { href: '/profile', label: 'Profile', icon: 'fa-user' },
      ]
    : [
        { href: '/', label: 'Home', icon: 'fa-home' },
        { href: '/login', label: 'Login', icon: 'fa-sign-in-alt' },
        { href: '/register', label: 'Register', icon: 'fa-user-plus' },
      ];

  return {
    user: user ? { id: user.id, email: user.email } : null,
    navItems,
    isNativeApp: locals.isNativeApp,
  };
};