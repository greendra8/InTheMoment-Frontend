// Constants
const STORAGE_PREFIX = 'audio_progress_';
const COOKIE_NAME = 'last_meditation_progress';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SAVE_TIME = 30; // Don't save progress if less than 30 seconds
const END_THRESHOLD = 60; // Don't save progress if within last minute
const SAVE_DEBOUNCE_MS = 2000; // Only save every 2 seconds
const MIN_PROGRESS_CHANGE = 2; // Minimum seconds of progress change to consider audio playing

interface AudioProgress {
    timestamp: number;
    progress: number;
    lastKnownTime?: number; // Track last known time to detect if audio is playing
}

interface LastMeditationInfo {
    id: string;
    timestamp: number;
}

// Keep track of last save time and progress for each meditation
const lastSaveTime: { [key: string]: number } = {};
const lastSavedProgress: { [key: string]: number } = {};

// Helper function to set a cookie
function setCookie(name: string, value: string, days: number = 7) {
    if (typeof document === 'undefined') return; // Guard for SSR

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

// Helper function to clear a cookie
function clearCookie(name: string) {
    if (typeof document === 'undefined') return; // Guard for SSR
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
}

export function saveAudioProgress(meditationId: string, currentTime: number, duration: number): void {
    // Don't save if we're at the start or near the end
    if (currentTime < MIN_SAVE_TIME || duration - currentTime < END_THRESHOLD) {
        clearAudioProgress(meditationId);
        return;
    }

    const now = Date.now();

    // Only save if enough time has passed since last save
    if (lastSaveTime[meditationId] && now - lastSaveTime[meditationId] < SAVE_DEBOUNCE_MS) {
        return;
    }

    // Check if audio is actually playing by comparing with last saved progress
    const isPlaying = isAudioPlaying(meditationId, currentTime);

    const data: AudioProgress = {
        timestamp: now,
        progress: currentTime,
        lastKnownTime: currentTime
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_PREFIX + meditationId, JSON.stringify(data));

    // Only update the cookie if:
    // 1. We have meaningful progress (past MIN_SAVE_TIME)
    // 2. The audio is actually playing (not just opened with existing progress)
    if (currentTime >= MIN_SAVE_TIME && isPlaying) {
        const lastMeditationInfo: LastMeditationInfo = {
            id: meditationId,
            timestamp: now
        };
        setCookie(COOKIE_NAME, JSON.stringify(lastMeditationInfo));
    }

    // Update tracking variables
    lastSaveTime[meditationId] = now;
    lastSavedProgress[meditationId] = currentTime;
}

// Determine if audio is actually playing by checking if progress has changed meaningfully
function isAudioPlaying(meditationId: string, currentTime: number): boolean {
    // If we don't have a previous progress value, assume it's not playing
    if (typeof lastSavedProgress[meditationId] === 'undefined') {
        return false;
    }

    // Check if progress has advanced by at least MIN_PROGRESS_CHANGE seconds
    const progressChange = Math.abs(currentTime - lastSavedProgress[meditationId]);
    return progressChange >= MIN_PROGRESS_CHANGE;
}

// Force save progress regardless of debounce time
export function forceSaveAudioProgress(meditationId: string, currentTime: number, duration: number): void {
    // Don't save if we're at the start or near the end
    if (currentTime < MIN_SAVE_TIME || duration - currentTime < END_THRESHOLD) {
        clearAudioProgress(meditationId);
        return;
    }

    // Check if audio is actually playing by comparing with last saved progress
    const isPlaying = isAudioPlaying(meditationId, currentTime);

    const now = Date.now();
    const data: AudioProgress = {
        timestamp: now,
        progress: currentTime,
        lastKnownTime: currentTime
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_PREFIX + meditationId, JSON.stringify(data));

    // Only update the cookie if:
    // 1. We have meaningful progress (past MIN_SAVE_TIME)
    // 2. The audio is actually playing (not just opened with existing progress)
    if (currentTime >= MIN_SAVE_TIME && isPlaying) {
        const lastMeditationInfo: LastMeditationInfo = {
            id: meditationId,
            timestamp: now
        };
        setCookie(COOKIE_NAME, JSON.stringify(lastMeditationInfo));
    }

    // Update tracking variables
    lastSaveTime[meditationId] = now;
    lastSavedProgress[meditationId] = currentTime;
}

export function getAudioProgress(meditationId: string): number | null {
    try {
        const data = localStorage.getItem(STORAGE_PREFIX + meditationId);
        if (!data) return null;

        const progress: AudioProgress = JSON.parse(data);

        // Check if the progress is expired (older than a week)
        if (Date.now() - progress.timestamp > WEEK_IN_MS) {
            clearAudioProgress(meditationId);
            return null;
        }

        // Initialize lastSavedProgress for this meditation if we're loading it
        lastSavedProgress[meditationId] = progress.progress;

        return progress.progress;
    } catch (error) {
        console.error('Error reading audio progress:', error);
        return null;
    }
}

export function clearAudioProgress(meditationId: string): void {
    localStorage.removeItem(STORAGE_PREFIX + meditationId);

    // Clear tracking variables
    delete lastSaveTime[meditationId];
    delete lastSavedProgress[meditationId];

    // Check if this is the current meditation in the cookie
    try {
        const lastMeditationId = getLastMeditationFromCookie();
        if (lastMeditationId === meditationId) {
            // Clear the cookie if we're clearing the current meditation
            clearCookie(COOKIE_NAME);
        }
    } catch (e) {
        // Ignore errors and just try to clear the cookie
        clearCookie(COOKIE_NAME);
    }
}

// Cleanup function to remove expired progress entries
export function cleanupExpiredProgress(): void {
    try {
        const now = Date.now();
        let anyRemoved = false;

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                try {
                    const data: AudioProgress = JSON.parse(localStorage.getItem(key) || '');
                    if (now - data.timestamp > WEEK_IN_MS) {
                        localStorage.removeItem(key);

                        // Clean up tracking variables
                        const meditationId = key.replace(STORAGE_PREFIX, '');
                        delete lastSaveTime[meditationId];
                        delete lastSavedProgress[meditationId];

                        anyRemoved = true;
                    }
                } catch (e) {
                    // If the data is corrupted, remove it
                    localStorage.removeItem(key);
                    anyRemoved = true;
                }
            }
        });

        // If we removed any entries, check if the cookie needs to be cleared
        if (anyRemoved) {
            const lastMeditationId = getLastMeditationFromCookie();
            if (lastMeditationId) {
                // Check if this meditation still has progress
                const hasProgress = localStorage.getItem(STORAGE_PREFIX + lastMeditationId) !== null;
                if (!hasProgress) {
                    clearCookie(COOKIE_NAME);
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning up expired progress:', error);
    }
}

// Parse the last meditation info from cookies
export function getLastMeditationFromCookie(): string | null {
    if (typeof document === 'undefined') return null; // Guard for SSR

    try {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(COOKIE_NAME + '='))
            ?.split('=')[1];

        if (!cookieValue) return null;

        const lastMeditation: LastMeditationInfo = JSON.parse(decodeURIComponent(cookieValue));

        // Check if it's expired
        if (Date.now() - lastMeditation.timestamp > WEEK_IN_MS) {
            clearCookie(COOKIE_NAME);
            return null;
        }

        return lastMeditation.id;
    } catch (error) {
        console.error('Error reading last meditation from cookie:', error);
        return null;
    }
} 