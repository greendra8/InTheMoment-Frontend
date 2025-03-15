// +layout.server.ts
import type { LayoutServerLoad } from './$types';

// Set to false to disable logging
const DEBUG = false;

// Helper function for conditional logging
function log(...args: any[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user, profile, isNativeApp } = locals;
  const isAdmin = user?.id === 'cf39c581-6b6f-44b7-8c56-f7f64a26637c';

  log('[Layout] Loading layout, path:', url.pathname);
  log('[Layout] User logged in:', !!user);
  log('[Layout] Profile available:', !!profile);

  // Get theme from profile or default to cosmic
  const theme = profile?.theme || 'cosmic';
  log('[Layout] Using theme:', theme);

  // No need for auth checks or redirects - they're now in hooks.server.ts

  const navItems = user
    ? [
      { href: '/dashboard', label: 'Explore', icon: 'fa-compass' },
      { href: '/library', label: 'Library', icon: 'fa-list' },
      { href: '/new', label: 'New', icon: 'fa-plus' },
      { href: '/playlists', label: 'Learn', icon: 'fa-book' },
      { href: '/profile', label: 'Profile', icon: 'fa-user' },
      //...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: 'fa-cog' }] : []),
    ]
    : [
      { href: '/', label: 'Home', icon: 'fa-home' },
      { href: '/login', label: 'Login', icon: 'fa-sign-in-alt' },
      { href: '/register', label: 'Register', icon: 'fa-user-plus' },
    ];

  // Create a session with profile included
  const sessionWithProfile = profile && session ? { ...session, profile } : session;

  return {
    user: user ? { id: user.id, email: user.email } : null,
    navItems,
    isNativeApp,
    session: sessionWithProfile,
    theme,
    profile // Add profile directly to make it available in all routes
  };
};