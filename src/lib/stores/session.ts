// This module creates a writable store for managing the user's session.
// It initializes the session as null and can be updated throughout the app lifecycle.
// Imported as sessionStore

import { writable } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);