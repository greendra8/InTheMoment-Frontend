// +layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isUserProfileComplete } from '$lib/server/supabase';
import { isAdminUser } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

// Set to false to disable logging
const DEBUG = false;

// Helper function for conditional logging
function log(...args: any[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
  const session = locals.session;
  const isAdmin = isAdminUser(locals);
  // Get profile from locals instead of making another database call
  const profile = locals.profile;

  log('[Layout] Loading layout, path:', url.pathname);
  log('[Layout] User logged in:', !!session?.user);
  log('[Layout] Profile from locals:', !!profile);
  log('[Layout] Profile theme:', profile?.theme);

  // Get theme from profile or default to galaxy
  const theme = profile?.theme || 'galaxy';
  log('[Layout] Using theme:', theme);

  if (session?.user) {
    const isComplete = await isUserProfileComplete(session.user.id);
    if (!isComplete && url.pathname !== '/profile-setup') {
      throw redirect(303, '/profile-setup');
    }
    // Redirect logged-in users from "/" to "/dashboard"
    if (url.pathname === '/' || url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/reset-password") {
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

  return {
    user: session?.user ? { id: session.user.id, email: session.user.email } : null,
    isNativeApp: locals.isNativeApp,
    session,
    theme,
    isAdmin
  };
};