import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Theme types
export type ThemeType = 'light' | 'dark' | 'cosmic';

// Create theme store with default light theme
export const theme = writable<ThemeType>('light');

// Apply theme to document
export function applyTheme(newTheme: ThemeType) {
    if (!browser) return;

    localStorage.setItem('theme', newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`; // 1 year

    // Only remove/add classes if they're different from current
    const html = document.documentElement;
    const currentClass = html.classList.contains('dark-theme') ? 'dark-theme' :
        html.classList.contains('cosmic-theme') ? 'cosmic-theme' : '';
    const newClass = newTheme === 'dark' ? 'dark-theme' :
        newTheme === 'cosmic' ? 'cosmic-theme' : '';

    if (currentClass !== newClass) {
        if (currentClass) html.classList.remove(currentClass);
        if (newClass) html.classList.add(newClass);
    }
}

// Toggle theme function
export function toggleTheme() {
    theme.update(current => {
        const newTheme: ThemeType = current === 'light' ? 'dark' :
            current === 'dark' ? 'cosmic' : 'light';
        applyTheme(newTheme);
        return newTheme;
    });
}

export default theme; 