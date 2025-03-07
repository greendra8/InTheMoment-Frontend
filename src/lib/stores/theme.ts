import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { updateUserTheme } from '$lib/api';
import { session } from '$lib/stores/session';
import type { ExtendedSession } from '$lib/stores/session';
import { get } from 'svelte/store';

// Theme types
export type ThemeType = 'light' | 'dark' | 'cosmic';

// Track the last applied theme to prevent redundant applications
let lastAppliedTheme: ThemeType | null = null;

// Flag to track if we're loading theme from profile
let loadingFromProfile = false;

// Flag to enable/disable debug logging
const DEBUG = true;

/**
 * Helper function to check if current page is landing or auth page
 */
export function isLandingOrAuthPage(): boolean {
    if (!browser) return false;

    return (
        window.location.pathname === '/' ||
        window.location.pathname === '/login' ||
        window.location.pathname === '/register'
    );
}

/**
 * Helper function to get theme from localStorage
 */
export function getThemeFromStorage(): ThemeType | null {
    if (!browser) return null;

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'cosmic') {
        return storedTheme as ThemeType;
    }

    return null;
}

/**
 * Helper function for debug logging
 */
function log(message: string, ...args: any[]): void {
    if (DEBUG) {
        console.log(`[Theme] ${message}`, ...args);
    }
}

/**
 * Get initial theme - this should match what we set in app.html
 */
function getInitialTheme(): ThemeType {
    if (!browser) return 'cosmic';

    log('Getting initial theme');

    // Force cosmic on landing/auth pages
    if (isLandingOrAuthPage()) {
        log('Forcing cosmic theme for landing/auth page');
        return 'cosmic';
    }

    // Check current session for theme
    const currentSession = get(session);
    if (currentSession?.user && currentSession.profile?.theme) {
        const profileTheme = currentSession.profile.theme;
        log('Found theme in session profile:', profileTheme);
        if (profileTheme === 'light' || profileTheme === 'dark' || profileTheme === 'cosmic') {
            return profileTheme as ThemeType;
        }
    }

    // Try localStorage
    const storedTheme = getThemeFromStorage();
    log('Found theme in localStorage:', storedTheme);
    if (storedTheme) {
        // Track this as the last applied theme since app.html already applied it
        lastAppliedTheme = storedTheme;
        return storedTheme;
    }

    // Default to cosmic
    log('Using default cosmic theme');
    return 'cosmic';
}

// Create theme store with the initial theme value
export const theme = writable<ThemeType>(getInitialTheme());

/**
 * Apply theme to document (DOM and persistence)
 */
export function applyTheme(
    newTheme: ThemeType,
    options: {
        saveToDb?: boolean,
        saveToStorage?: boolean,
        force?: boolean
    } = {}
): void {
    if (!browser) return;

    const {
        saveToDb = !loadingFromProfile, // Don't save to DB if loading from profile
        saveToStorage = true,
        force = false
    } = options;

    // Skip if this theme was already applied (unless forced)
    if (!force && newTheme === lastAppliedTheme) {
        return;
    }

    // Update tracking
    lastAppliedTheme = newTheme;

    // Don't save cosmic theme to localStorage on landing/auth pages
    if (saveToStorage && !isLandingOrAuthPage()) {
        log('Saving theme to localStorage');
        localStorage.setItem('theme', newTheme);
    }

    // Apply theme class to document
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    if (newTheme === 'light') {
        document.documentElement.classList.add('light-theme');
    } else if (newTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    }
    // For cosmic theme, we don't need to add a class since it's the default in :root

    // Save theme to database if requested and user is logged in
    if (saveToDb && !isLandingOrAuthPage()) {
        const currentSession = get(session);
        if (currentSession?.user && currentSession?.profile?.theme !== newTheme) {
            log('Saving theme to database');
            updateUserTheme(currentSession.user.id, newTheme).catch(err => {
                console.error('[Theme] Failed to update theme in database:', err);
            });
        }
    }
}

/**
 * Toggle theme function - explicitly user-initiated
 */
export function toggleTheme(): void {
    // Don't toggle theme on landing or auth pages
    if (isLandingOrAuthPage()) return;

    theme.update(currentTheme => {
        let newTheme: ThemeType;

        // Cycle through themes: cosmic → light → dark → cosmic
        if (currentTheme === 'cosmic') {
            newTheme = 'light';
        } else if (currentTheme === 'light') {
            newTheme = 'dark';
        } else {
            newTheme = 'cosmic';
        }

        log('Toggling theme from:', currentTheme, 'to:', newTheme);

        // This is a user-initiated change, so save to DB
        applyTheme(newTheme, { saveToDb: true });
        return newTheme;
    });
}

/**
 * Set theme - can be used for both user and system changes
 */
export function setTheme(newTheme: ThemeType, saveToDb = true): void {
    const currentTheme = get(theme);
    if (newTheme !== currentTheme) {
        log('Setting theme to:', newTheme, 'saveToDb:', saveToDb);

        // If this is a system change (not saving to DB), set the loading flag
        if (!saveToDb) {
            loadingFromProfile = true;
            setTimeout(() => { loadingFromProfile = false; }, 100);
        }

        theme.set(newTheme);
    }
}

// Initialize theme system
if (browser) {
    // Apply theme when the store value changes
    theme.subscribe(newTheme => {
        log('Theme store updated:', newTheme);
        applyTheme(newTheme, { saveToDb: !loadingFromProfile });
    });

    // Handle session/profile changes and update theme if needed
    session.subscribe((currentSession: ExtendedSession | null) => {
        // Skip updates if no user, no profile, or on landing pages
        if (!currentSession?.user || isLandingOrAuthPage()) return;

        log('Session updated:', currentSession.user.id);

        // Get profile theme preference
        const profileTheme = currentSession.profile?.theme;
        log('Profile theme:', profileTheme);

        // Skip if profile theme is invalid
        if (profileTheme !== 'light' && profileTheme !== 'dark' && profileTheme !== 'cosmic') {
            log('No valid theme in profile');
            return;
        }

        const currentThemeValue = get(theme);

        // Only update if different to avoid circular updates
        if (profileTheme !== currentThemeValue) {
            log('Setting theme from profile:', profileTheme);

            // Use setTheme with saveToDb=false to indicate this is a system change
            setTheme(profileTheme as ThemeType, false);
        }
    });
}

export default theme; 