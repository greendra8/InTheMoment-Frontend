// +layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isUserProfileComplete } from '$lib/server/supabase';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session;

  if (session?.user) {
    const isComplete = await isUserProfileComplete(session.user.id);
    if (!isComplete && url.pathname !== '/profile-setup') {
      throw redirect(303, '/profile-setup');
    }

    // Redirect logged-in users from "/" to "/dashboard"
    if (url.pathname === '/' || url.pathname === "/login" || url.pathname === "/register") {
      throw redirect(303, '/dashboard');
    }
  }

  if (
    !session?.user &&
    (url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/meditation') ||
      url.pathname.startsWith('/profile') ||
      url.pathname.startsWith('/list'))
  ) {
    throw redirect(303, '/login');
  }

  const navItems = session?.user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: 'fa-home' },
        { href: '/library', label: 'Library', icon: 'fa-list' },
        { href: '/meditation', label: 'Meditation', icon: 'fa-spa' },
        { href: '/profile', label: 'Profile', icon: 'fa-user' },
      ]
    : [
        { href: '/', label: 'Home', icon: 'fa-home' },
        { href: '/login', label: 'Login', icon: 'fa-sign-in-alt' },
        { href: '/register', label: 'Register', icon: 'fa-user-plus' },
      ];

  return {
    user: session?.user ? { id: session.user.id, email: session.user.email } : null,
    navItems,
    isNativeApp: locals.isNativeApp,
    session, // Add this line
  };
};