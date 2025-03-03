// +layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isUserProfileComplete } from '$lib/server/supabase';

const THEME_CLASSES = {
  dark: 'dark-theme',
  cosmic: 'cosmic-theme',
  light: ''
} as const;

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
  const session = locals.session;
  const theme = cookies.get('theme') || 'light';
  const themeClass = THEME_CLASSES[theme as keyof typeof THEME_CLASSES];
  const isAdmin = session?.user?.id === 'cf39c581-6b6f-44b7-8c56-f7f64a26637c';

  if (session?.user) {
    // Handle authenticated user redirects
    const [isComplete, shouldRedirect] = await Promise.all([
      isUserProfileComplete(session.user.id),
      url.pathname === '/' || url.pathname === "/login" || url.pathname === "/register"
    ]);

    if (!isComplete && url.pathname !== '/profile-setup') {
      throw redirect(303, '/profile-setup');
    }
    if (shouldRedirect) {
      throw redirect(303, '/dashboard');
    }
    if (url.pathname.startsWith('/admin') && !isAdmin) {
      throw redirect(303, '/dashboard');
    }
  } else if (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/session') ||
    url.pathname.startsWith('/playlists') ||
    url.pathname.startsWith('/new') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/profile') ||
    url.pathname.startsWith('/list')
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
    session,
    theme,
    themeClass,
  };
};