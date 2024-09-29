import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabaseClient';
import { browser } from '$app/environment';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set: internalSet, update } = writable<AuthState>({
    user: null,
    isLoading: true,
  });

  async function initializeAuth() {
    if (browser) {
      const { data: { session } } = await supabase.auth.getSession();
      internalSet({ user: session?.user ?? null, isLoading: false });

      supabase.auth.onAuthStateChange((_, session) => {
        update(state => ({ ...state, user: session?.user ?? null }));
      });
    }
  }

  return {
    subscribe,
    initializeAuth,
    set: (state: AuthState) => internalSet(state),
  };
}

export const authStore = createAuthStore();