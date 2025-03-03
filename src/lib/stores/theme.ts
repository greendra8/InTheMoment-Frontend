import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Theme types
export type ThemeType = 'light' | 'dark' | 'cosmic';

// Initialize theme from localStorage or default to light
const storedTheme = browser && localStorage.getItem('theme');
const initialTheme: ThemeType = (storedTheme === 'dark' || storedTheme === 'cosmic')
    ? storedTheme as ThemeType
    : 'light';

// Create theme store
export const theme = writable<ThemeType>(initialTheme);

// Apply theme to document
export function applyTheme(newTheme: ThemeType) {
    if (browser) {
        // Save to localStorage
        localStorage.setItem('theme', newTheme);

        // Remove all theme classes first
        document.documentElement.classList.remove('dark-theme', 'cosmic-theme');

        // Apply theme class to document
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        } else if (newTheme === 'cosmic') {
            document.documentElement.classList.add('cosmic-theme');
        }
    }
}

// Toggle theme function
export function toggleTheme() {
    theme.update(currentTheme => {
        let newTheme: ThemeType;
        if (currentTheme === 'light') {
            newTheme = 'dark';
        } else if (currentTheme === 'dark') {
            newTheme = 'cosmic';
        } else {
            newTheme = 'light';
        }
        applyTheme(newTheme);
        return newTheme;
    });
}

// Initialize theme on load - only if the theme classes don't match the stored theme
// This prevents unnecessary DOM manipulations on initial load
if (browser) {
    const hasCosmicClass = document.documentElement.classList.contains('cosmic-theme');
    const hasDarkClass = document.documentElement.classList.contains('dark-theme');

    // Only apply if there's a mismatch between the class and the stored theme
    if ((initialTheme === 'cosmic' && !hasCosmicClass) ||
        (initialTheme === 'dark' && !hasDarkClass) ||
        (initialTheme === 'light' && (hasCosmicClass || hasDarkClass))) {
        applyTheme(initialTheme);
    }
}

export default theme; 