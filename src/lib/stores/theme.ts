import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Theme types
export type ThemeType = 'light' | 'dark' | 'cosmic';

// Check if we're on landing or auth pages
const isLandingOrAuthPage = browser && (
    window.location.pathname === '/' ||
    window.location.pathname === '/login' ||
    window.location.pathname === '/register'
);

// Read theme from cookie if localStorage is empty (helps with persistence across login/logout)
function getThemeFromCookie(): ThemeType | null {
    if (!browser) return null;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'theme') {
            if (value === 'light' || value === 'dark' || value === 'cosmic') {
                return value as ThemeType;
            }
        }
    }
    return null;
}

// Get initial theme - this should match what we set in app.html
function getInitialTheme(): ThemeType {
    if (!browser) return 'cosmic';

    // Force cosmic on landing/auth pages
    if (isLandingOrAuthPage) return 'cosmic';

    // Try localStorage first
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'cosmic') {
        return storedTheme as ThemeType;
    }

    // Try cookie next
    const cookieTheme = getThemeFromCookie();
    if (cookieTheme) return cookieTheme;

    // Default to cosmic
    return 'cosmic';
}

// Create theme store with the initial theme value
export const theme = writable<ThemeType>(getInitialTheme());

// Apply theme to document
export function applyTheme(newTheme: ThemeType) {
    if (browser) {
        // Save to localStorage
        localStorage.setItem('theme', newTheme);

        // Save theme to cookie for persistence across login/logout
        document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;

        // Remove all theme classes first
        document.documentElement.classList.remove('light-theme', 'dark-theme');

        // Apply theme class to document
        if (newTheme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else if (newTheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        }
        // For cosmic theme, we don't need to add a class since it's the default in :root
    }
}

// Toggle theme function
export function toggleTheme() {
    // Don't toggle theme on landing or auth pages
    if (isLandingOrAuthPage) return;

    theme.update(currentTheme => {
        let newTheme: ThemeType;
        // Reordered to go cosmic → light → dark → cosmic
        if (currentTheme === 'cosmic') {
            newTheme = 'light';
        } else if (currentTheme === 'light') {
            newTheme = 'dark';
        } else {
            newTheme = 'cosmic';
        }
        applyTheme(newTheme);
        return newTheme;
    });
}

// Apply theme changes when the store value changes
if (browser) {
    theme.subscribe(newTheme => {
        applyTheme(newTheme);
    });
}

export default theme; 