// This module creates a writable store for managing the user's session.
// It initializes the session as null and can be updated throughout the app lifecycle.
// Imported as sessionStore

import { writable, derived } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';

// Define an extended session type that includes profile
export interface ExtendedSession extends Session {
    profile?: {
        id: string;
        name?: string;
        theme?: string;
        [key: string]: any;
    };
}

// Create the session store with the extended type
export const session = writable<ExtendedSession | null>(null);

// Create a derived store for profile for easier access
export const profile = derived(session, ($session) => $session?.profile || null);

// Only log session changes in development and when explicitly enabled
const DEBUG_SESSION = false;

if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && DEBUG_SESSION) {
    session.subscribe((value) => {
        console.log('[Session Store] Session updated:', !!value?.user);
        console.log('[Session Store] Has profile:', !!value?.profile);
        if (value?.profile?.theme) {
            console.log('[Session Store] Profile theme:', value.profile.theme);
        }
    });
}

export default session;