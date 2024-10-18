// +layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isUserProfileComplete } from '$lib/server/supabase';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = locals.session;
  const isAdmin = session?.user?.id === 'cf39c581-6b6f-44b7-8c56-f7f64a26637c';

  if (session?.user) {
    const isComplete = await isUserProfileComplete(session.user.id);
    if (!isComplete && url.pathname !== '/profile-setup') {
      throw redirect(303, '/profile-setup');
    }
    // Redirect logged-in users from "/" to "/dashboard"
    if (url.pathname === '/' || url.pathname === "/login" || url.pathname === "/register") {
      throw redirect(303, '/dashboard');
    }

    // only allow admin user to access admin routes
    if (url.pathname.startsWith('/admin') && !isAdmin) {
      throw redirect(303, '/dashboard');
    }
  }

  if (
    !session?.user &&
    (url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/session') ||
      url.pathname.startsWith('/playlists') ||
      url.pathname.startsWith('/new') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/profile') ||
      url.pathname.startsWith('/list'))
  ) {
    throw redirect(303, '/login');
  }

  const navItems = session?.user
    ? [
      { href: '/dashboard', label: 'Explore', icon: 'fa-compass' },
      { href: '/library', label: 'Library', icon: 'fa-list' },
      { href: '/new', label: 'New', icon: 'fa-plus' },
      { href: '/playlists', label: 'Learn', icon: 'fa-book' },
      { href: '/profile', label: 'Profile', icon: 'fa-user' },
      ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: 'fa-cog' }] : []),
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