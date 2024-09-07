import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

function createAuthStore() {
  const { subscribe, set } = writable<User | null>(null);

  return {
    subscribe,
    set: (user: User | null) => {
      console.log('Setting user:', user);
      set(user);
    },
    check: async () => {
      console.log('Checking auth state...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth check result:', session?.user);
      set(session?.user ?? null);
      return session?.user ?? null;
    },
    signOut: async () => {
      console.log('Signing out...');
      await supabase.auth.signOut({ scope: 'local' });
      set(null);
    },
    getToken: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    }
  };
}

export const authStore = createAuthStore();

// Initialize the auth store
authStore.check().then(user => {
  console.log('Initial auth check completed:', user);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_, session) => {
  console.log('Auth state changed:', session?.user);
  authStore.set(session?.user ?? null);
});