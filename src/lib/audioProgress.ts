// Constants
const STORAGE_PREFIX = 'audio_progress_';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SAVE_TIME = 30; // Don't save progress if less than 30 seconds
const END_THRESHOLD = 60; // Don't save progress if within last minute
const SAVE_DEBOUNCE_MS = 2000; // Only save every 2 seconds

interface AudioProgress {
    timestamp: number;
    progress: number;
}

// Keep track of last save time for each meditation
const lastSaveTime: { [key: string]: number } = {};

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

    const data: AudioProgress = {
        timestamp: now,
        progress: currentTime
    };

    localStorage.setItem(STORAGE_PREFIX + meditationId, JSON.stringify(data));
    lastSaveTime[meditationId] = now;
}

// Force save progress regardless of debounce time
export function forceSaveAudioProgress(meditationId: string, currentTime: number, duration: number): void {
    // Don't save if we're at the start or near the end
    if (currentTime < MIN_SAVE_TIME || duration - currentTime < END_THRESHOLD) {
        clearAudioProgress(meditationId);
        return;
    }

    const data: AudioProgress = {
        timestamp: Date.now(),
        progress: currentTime
    };

    localStorage.setItem(STORAGE_PREFIX + meditationId, JSON.stringify(data));
    lastSaveTime[meditationId] = Date.now();
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

        return progress.progress;
    } catch (error) {
        console.error('Error reading audio progress:', error);
        return null;
    }
}

export function clearAudioProgress(meditationId: string): void {
    localStorage.removeItem(STORAGE_PREFIX + meditationId);
}

// Cleanup function to remove expired progress entries
export function cleanupExpiredProgress(): void {
    try {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                try {
                    const data: AudioProgress = JSON.parse(localStorage.getItem(key) || '');
                    if (now - data.timestamp > WEEK_IN_MS) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // If the data is corrupted, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.error('Error cleaning up expired progress:', error);
    }
} 