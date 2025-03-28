import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { session } from '$lib/stores/session';
import type { ExtendedSession } from '$lib/stores/session';
import { get } from 'svelte/store';

// Theme types
export type ThemeType = 'gem' | 'galaxy';

// Track the last applied theme to prevent redundant applications
let lastAppliedTheme: ThemeType | null = null;

// Flag to enable/disable debug logging
const DEBUG = false; // Set to false to reduce console logs

/**
 * Helper function to check if current page is landing or auth page
 */
export function isLandingOrAuthPage(): boolean {
    if (!browser) return false;

    return (
        window.location.pathname === '/' ||
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/reset-password'
    );
}

/**
 * Helper function to get theme from localStorage
 */
export function getThemeFromStorage(): ThemeType | null {
    if (!browser) return null;

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'gem' || storedTheme === 'galaxy') {
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
    if (!browser) return 'galaxy';

    log('Getting initial theme');

    // Force galaxy on landing/auth pages
    if (isLandingOrAuthPage()) {
        log('Forcing galaxy theme for landing/auth page');
        return 'galaxy';
    }

    // Try localStorage first (faster than waiting for session)
    const storedTheme = getThemeFromStorage();
    if (storedTheme) {
        log('Found theme in localStorage:', storedTheme);
        // Track this as the last applied theme since app.html already applied it
        lastAppliedTheme = storedTheme;
        return storedTheme;
    }

    // Default to galaxy
    log('Using default galaxy theme');
    return 'galaxy';
}

// Create theme store with the initial theme value
export const theme = writable<ThemeType>(getInitialTheme());

/**
 * Apply theme to document (DOM and localStorage)
 */
export function applyTheme(
    newTheme: ThemeType,
    options: {
        saveToStorage?: boolean,
        force?: boolean
    } = {}
): void {
    if (!browser) return;

    const {
        saveToStorage = true,
        force = false
    } = options;

    // Skip if this theme was already applied (unless forced)
    if (!force && newTheme === lastAppliedTheme) {
        log('Theme already applied, skipping:', newTheme);
        return;
    }

    log('Applying theme:', newTheme);

    // Update tracking
    lastAppliedTheme = newTheme;

    // Don't save galaxy theme to localStorage on landing/auth pages
    if (saveToStorage && !isLandingOrAuthPage()) {
        log('Saving theme to localStorage');
        localStorage.setItem('theme', newTheme);
    }

    // Apply theme class to document
    document.documentElement.classList.remove('gem-theme');
    if (newTheme === 'gem') {
        document.documentElement.classList.add('gem-theme');
    }
    // For galaxy theme, we don't need to add a class since it's the default in :root
}

/**
 * Toggle theme function - cycles between galaxy and gem
 */
export function toggleTheme(): void {
    // Don't toggle theme on landing or auth pages
    if (isLandingOrAuthPage()) return;

    theme.update(currentTheme => {
        let newTheme: ThemeType;

        // Cycle between galaxy and gem
        if (currentTheme === 'galaxy') {
            newTheme = 'gem';
        } else {
            newTheme = 'galaxy';
        }

        log('Toggling theme from:', currentTheme, 'to:', newTheme);

        // Apply theme to DOM and localStorage
        applyTheme(newTheme);
        return newTheme;
    });
}

/**
 * Set theme - updates the theme store
 * Note: Database updates should be handled by the component that calls this
 */
export function setTheme(newTheme: ThemeType): void {
    const currentTheme = get(theme);
    if (newTheme !== currentTheme) {
        log('Setting theme to:', newTheme);
        theme.set(newTheme);
    } else {
        log('Theme already set to', newTheme, ', skipping update');
    }
}

// Initialize theme system
if (browser) {
    // Apply theme when the store value changes
    theme.subscribe(newTheme => {
        log('Theme store updated:', newTheme);
        applyTheme(newTheme);
    });

    // Handle session/profile changes and update theme if needed
    let initialSessionProcessed = false;

    session.subscribe((currentSession: ExtendedSession | null) => {
        // Skip updates if no user, no profile, or on landing pages
        if (!currentSession?.user || isLandingOrAuthPage()) return;

        const profileTheme = currentSession.profile?.theme;
        const currentThemeValue = get(theme);

        // Skip if profile theme is invalid
        if (profileTheme !== 'gem' && profileTheme !== 'galaxy') {
            log('No valid theme in profile');
            return;
        }

        // Only log once for initial session
        if (!initialSessionProcessed) {
            log('Initial session loaded, profile theme:', profileTheme);
            initialSessionProcessed = true;
        }

        // Only update if different to avoid circular updates
        if (profileTheme !== currentThemeValue) {
            log('Updating theme from profile:', profileTheme);
            setTheme(profileTheme as ThemeType);
        } else {
            log('Profile theme matches current theme, no update needed');
        }
    });
}

export default theme; 