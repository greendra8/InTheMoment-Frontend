// +layout.ts
import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';

// Log auth state changes - Minimal essential logging retained
// if (browser) {
// 	supabase.auth.onAuthStateChange((event, session) => {
// 		console.log('[Layout Load] Auth State Change Event:', event, session ? session.user.id : 'No session');
// 	});
// }

export const load: LayoutLoad = async ({ data, depends }) => {
  depends('supabase:auth'); // Ensures invalidation when auth state changes

  // Initialize the client-side Supabase instance with session data from the server.
  // This should run *before* any component tries to use the client instance on load.
  if (browser) {
    // It's crucial that this instance is the same one used throughout your client-side components
    const { data: { session: clientSession } } = await supabase.auth.getSession();

    // Only call setSession if the server session exists and differs from the client one,
    // or if the client has no session when the server does.
    // This avoids unnecessary calls if the session is already synced (e.g., via onAuthStateChange).
    if (data.session && (!clientSession || clientSession.access_token !== data.session.access_token)) {
      // console.log('[Layout Load] Client session mismatch or missing. Setting session from server data.');
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    } else if (!data.session && clientSession) {
      // If server has no session but client does (e.g., after logout elsewhere), clear client session
      // console.log('[Layout Load] Server session missing, client has one. Signing out client.');
      await supabase.auth.signOut();
    }
  }

  // Optional: Set up onAuthStateChange listener if needed for real-time UI updates
  // Be mindful not to duplicate session setting logic heavily here.
  // if (browser) {
  // 	const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  // 		// Handle event changes for UI reactivity if needed (e.g., update a Svelte store)
  // 		// console.log('[Layout Load] Auth State Change Event:', event);
  // 	});
  //   // Remember to unsubscribe onDestroy if you activate this listener here
  // }

  return { ...data }; // Pass all data down, including the original session data
};