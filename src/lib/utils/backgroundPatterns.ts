// List of background images all found in static/images/backgrounds 1-n.jpeg
export const bgPatterns = Array.from({ length: 16 }, (_, i) => `/images/backgrounds/${i + 1}.jpeg`);

/**
 * Returns a deterministic background pattern based on object properties
 * @param item - The object with id and name/title properties
 * @returns A URL string pointing to a background image
 */
export function getDeterministicBgPattern(item: any): string {
    // Use either title (for meditations) or playlist_name (for playlists)
    const itemName = item.title || item.playlist_name || '';

    // Create a hash from the item id and name to ensure consistency
    const stringToHash = item.id + itemName;
    let hash = 0;

    // Simple string hash function
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Ensure positive index by using absolute value, then mod by array length
    const index = Math.abs(hash) % bgPatterns.length;
    return bgPatterns[index];
}

/**
 * Assigns background patterns to an array of items (meditations or playlists)
 * @param items - Array of meditation or playlist objects
 * @returns A new array of items with bgPattern property added
 */
export function assignBackgrounds(items: any[]): any[] {
    if (!items) return [];
    return items.map((item) => ({
        ...item,
        bgPattern: getDeterministicBgPattern(item)
    }));
} 