// List of background images all found in static/images/backgrounds 1-n.jpeg
export const bgPatterns = Array.from({ length: 16 }, (_, i) => `/images/backgrounds/${i + 1}.jpeg`);

// SVG patterns encoded as base64 for playlists - matches the galaxy theme (default)
export const patternBase64 = [
    // Galaxy theme - Purple/blue gradient circles (matches --interactive-gradient-1/2: 106, 90, 205 and 132, 112, 255)
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIHZpZXdCb3g9JzAgMCAxNjAwIDgwMCc+PHJlY3QgZmlsbD0nIzE2MTYyZCcgd2lkdGg9JzE2MDAnIGhlaWdodD0nODAwJy8+PGcgc3Ryb2tlPScjZmZmJyBzdHJva2Utd2lkdGg9JzUwLjMnIHN0cm9rZS1vcGFjaXR5PScwLjA3JyA+PGNpcmNsZSAgZmlsbD0nIzE2MTYyZCcgY3g9JzAnIGN5PScwJyByPScxODAwJy8+PGNpcmNsZSAgZmlsbD0nIzFjMWMzNCcgY3g9JzAnIGN5PScwJyByPScxNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzIyMjEzYicgY3g9JzAnIGN5PScwJyByPScxNjAwJy8+PGNpcmNsZSAgZmlsbD0nIzI4MjY0MicgY3g9JzAnIGN5PScwJyByPScxNTAwJy8+PGNpcmNsZSAgZmlsbD0nIzJlMmM0OScgY3g9JzAnIGN5PScwJyByPScxNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzM0MzE1MCcgY3g9JzAnIGN5PScwJyByPScxMzAwJy8+PGNpcmNsZSAgZmlsbD0nIzNhMzc1NycgY3g9JzAnIGN5PScwJyByPScxMjAwJy8+PGNpcmNsZSAgZmlsbD0nIzQwM2Q1ZScgY3g9JzAnIGN5PScwJyByPScxMTAwJy8+PGNpcmNsZSAgZmlsbD0nIzQ2NDM2NScgY3g9JzAnIGN5PScwJyByPScxMDAwJy8+PGNpcmNsZSAgZmlsbD0nIzRjNDg2YycgY3g9JzAnIGN5PScwJyByPSc5MDAnLz48Y2lyY2xlICBmaWxsPScjNTI0ZTczJyBjeD0nMCcgY3k9JzAnIHI9JzgwMCcvPjxjaXJjbGUgIGZpbGw9JyM1ODU0N2EnIGN4PScwJyBjeT0nMCcgcj0nNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzVlNWE4MScgY3g9JzAnIGN5PScwJyByPSc2MDAnLz48Y2lyY2xlICBmaWxsPScjNjQ1Zjg4JyBjeD0nMCcgY3k9JzAnIHI9JzUwMCcvPjxjaXJjbGUgIGZpbGw9JyM2YTY1OGYnIGN4PScwJyBjeT0nMCcgcj0nNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzcwNmI5NicgY3g9JzAnIGN5PScwJyByPSczMDAnLz48Y2lyY2xlICBmaWxsPScjNzY3MTlkJyBjeD0nMCcgY3k9JzAnIHI9JzIwMCcvPjxjaXJjbGUgIGZpbGw9JyM4NDcwZmYnIGN4PScwJyBjeT0nMCcgcj0nMTAwJy8+PC9nPjwvc3ZnPg==",
    // Galaxy theme - Purple/indigo circles (matches darker variant of the main palette)
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIHZpZXdCb3g9JzAgMCAxNjAwIDgwMCc+PHJlY3QgZmlsbD0nIzE2MTYyZCcgd2lkdGg9JzE2MDAnIGhlaWdodD0nODAwJy8+PGcgc3Ryb2tlPScjZmZmJyBzdHJva2Utd2lkdGg9JzUwLjMnIHN0cm9rZS1vcGFjaXR5PScwLjA3JyA+PGNpcmNsZSAgZmlsbD0nIzE2MTYyZCcgY3g9JzAnIGN5PScwJyByPScxODAwJy8+PGNpcmNsZSAgZmlsbD0nIzFiMWEzNCcgY3g9JzAnIGN5PScwJyByPScxNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzIwMWUzYicgY3g9JzAnIGN5PScwJyByPScxNjAwJy8+PGNpcmNsZSAgZmlsbD0nIzI1MjI0MicgY3g9JzAnIGN5PScwJyByPScxNTAwJy8+PGNpcmNsZSAgZmlsbD0nIzJhMjY0OScgY3g9JzAnIGN5PScwJyByPScxNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzJmMmE1MCcgY3g9JzAnIGN5PScwJyByPScxMzAwJy8+PGNpcmNsZSAgZmlsbD0nIzM0MmU1NycgY3g9JzAnIGN5PScwJyByPScxMjAwJy8+PGNpcmNsZSAgZmlsbD0nIzM5MzI1ZScgY3g9JzAnIGN5PScwJyByPScxMTAwJy8+PGNpcmNsZSAgZmlsbD0nIzNlMzY2NScgY3g9JzAnIGN5PScwJyByPScxMDAwJy8+PGNpcmNsZSAgZmlsbD0nIzQzM2E2YycgY3g9JzAnIGN5PScwJyByPSc5MDAnLz48Y2lyY2xlICBmaWxsPScjNDgzZTczJyBjeD0nMCcgY3k9JzAnIHI9JzgwMCcvPjxjaXJjbGUgIGZpbGw9JyM0ZDQyN2EnIGN4PScwJyBjeT0nMCcgcj0nNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzUyNDY4MScgY3g9JzAnIGN5PScwJyByPSc2MDAnLz48Y2lyY2xlICBmaWxsPScjNTc0YTg4JyBjeD0nMCcgY3k9JzAnIHI9JzUwMCcvPjxjaXJjbGUgIGZpbGw9JyM1YzRlOGYnIGN4PScwJyBjeT0nMCcgcj0nNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzYxNTI5NicgY3g9JzAnIGN5PScwJyByPSczMDAnLz48Y2lyY2xlICBmaWxsPScjNjY1NjlkJyBjeD0nMCcgY3k9JzAnIHI9JzIwMCcvPjxjaXJjbGUgIGZpbGw9JyM2YTVhY2QnIGN4PScwJyBjeT0nMCcgcj0nMTAwJy8+PC9nPjwvc3ZnPg=="
];

// SVG patterns encoded as base64 for playlists - matches the gem theme (blue/cyan)
export const gemThemePatternBase64 = [
    // Gem theme - Blue gradient circles (user provided)
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIHZpZXdCb3g9JzAgMCAxNjAwIDgwMCc+PHJlY3QgZmlsbD0nIzE4MkQzNicgd2lkdGg9JzE2MDAnIGhlaWdodD0nODAwJy8+PGcgc3Ryb2tlPScjMjI0QTU4JyBzdHJva2Utd2lkdGg9JzUwLjMnIHN0cm9rZS1vcGFjaXR5PScwLjEnID48Y2lyY2xlICBmaWxsPScjMTgyRDM2JyBjeD0nMCcgY3k9JzAnIHI9JzE4MDAnLz48Y2lyY2xlICBmaWxsPScjMWEzMzNlJyBjeD0nMCcgY3k9JzAnIHI9JzE3MDAnLz48Y2lyY2xlICBmaWxsPScjMWMzYTQ3JyBjeD0nMCcgY3k9JzAnIHI9JzE2MDAnLz48Y2lyY2xlICBmaWxsPScjMWQ0MTRmJyBjeD0nMCcgY3k9JzAnIHI9JzE1MDAnLz48Y2lyY2xlICBmaWxsPScjMWY0NzU4JyBjeD0nMCcgY3k9JzAnIHI9JzE0MDAnLz48Y2lyY2xlICBmaWxsPScjMjA0ZTYxJyBjeD0nMCcgY3k9JzAnIHI9JzEzMDAnLz48Y2lyY2xlICBmaWxsPScjMjI1NTZiJyBjeD0nMCcgY3k9JzAnIHI9JzEyMDAnLz48Y2lyY2xlICBmaWxsPScjMjM1Yzc0JyBjeD0nMCcgY3k9JzAnIHI9JzExMDAnLz48Y2lyY2xlICBmaWxsPScjMjQ2MzdlJyBjeD0nMCcgY3k9JzAnIHI9JzEwMDAnLz48Y2lyY2xlICBmaWxsPScjMjY2YTg3JyBjeD0nMCcgY3k9JzAnIHI9JzkwMCcvPjxjaXJjbGUgIGZpbGw9JyMyNzcyOTEnIGN4PScwJyBjeT0nMCcgcj0nODAwJy8+PGNpcmNsZSAgZmlsbD0nIzI4Nzk5YicgY3g9JzAnIGN5PScwJyByPScNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzJhODBhNScgY3g9JzAnIHI9JzYwMCcvPjxjaXJjbGUgIGZpbGw9JyMyYjg4YjAnIGN4PScwJyBjeT0nMCcgcj0nNTAwJy8+PGNpcmNsZSAgZmlsbD0nIzJkOGZiYScgY3g9JzAnIGN5PScwJyByPScNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzJlOTdjNScgY3g9JzAnIHI9JzMwMCcvPjxjaXJjbGUgIGZpbGw9JyMzMDllY2YnIGN4PScwJyBjeT0nMCcgcj0nMjAwJy8+PGNpcmNsZSAgZmlsbD0nIzMyQTZEQScgY3g9JzAnIGN5PScwJyByPScxMDAnLz48L2c+PC9zdmc+",
    // Gem theme - Blue/cyan gradient circles (from previous implementation)
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIHZpZXdCb3g9JzAgMCAxNjAwIDgwMCc+PHJlY3QgZmlsbD0nIzFhMjYzMCcgd2lkdGg9JzE2MDAnIGhlaWdodD0nODAwJy8+PGcgc3Ryb2tlPScjZmZmJyBzdHJva2Utd2lkdGg9JzUwLjMnIHN0cm9rZS1vcGFjaXR5PScwLjA3JyA+PGNpcmNsZSAgZmlsbD0nIzFhMjYzMCcgY3g9JzAnIGN5PScwJyByPScxODAwJy8+PGNpcmNsZSAgZmlsbD0nIzFiMmIzNycgY3g9JzAnIGN5PScwJyByPScxNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzFjMzAzZScgY3g9JzAnIGN5PScwJyByPScxNjAwJy8+PGNpcmNsZSAgZmlsbD0nIzFkMzU0NScgY3g9JzAnIGN5PScwJyByPScxNTAwJy8+PGNpcmNsZSAgZmlsbD0nIzFlM2E0Yycgb3g9JzAnIGN5PScwJyByPScxNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzFmM2Y1Mycgb3g9JzAnIGN5PScwJyByPScxMzAwJy8+PGNpcmNsZSAgZmlsbD0nIzIwNDQ1YScgY3g9JzAnIGN5PScwJyByPScxMjAwJy8+PGNpcmNsZSAgZmlsbD0nIzIxNDk2MScgY3g9JzAnIGN5PScwJyByPScxMTAwJy8+PGNpcmNsZSAgZmlsbD0nIzIxNGU2OCcgY3g9JzAnIGN5PScwJyByPScxMDAwJy8+PGNpcmNsZSAgZmlsbD0nIzIyNTM2Zicgb3g9JzAnIGN5PScwJyByPSc5MDAnLz48Y2lyY2xlICBmaWxsPScjMjI1ODc2JyBveD0nMCcgY3k9JzAnIHI9JzgwMCcvPjxjaXJjbGUgIGZpbGw9JyMyMzVkN2QnIGN4PScwJyBjeT0nMCcgcj0nNzAwJy8+PGNpcmNsZSAgZmlsbD0nIzIzNjI4NCcgY3g9JzAnIGN5PScwJyByPSc2MDAnLz48Y2lyY2xlICBmaWxsPScjMjM2NzhiJyBjeD0nMCcgY3k9JzAnIHI9JzUwMCcvPjxjaXJjbGUgIGZpbGw9JyMyMzZjOTInIGN4PScwJyBjeT0nMCcgcj0nNDAwJy8+PGNpcmNsZSAgZmlsbD0nIzIzNzE5OScgY3g9JzAnIGN5PScwJyByPSczMDAnLz48Y2lyY2xlICBmaWxsPScjMjM3NmEwJyBjeD0nMCcgY3k9JzAnIHI9JzIwMCcvPjxjaXJjbGUgIGZpbGw9JyM0ZmFjZmUnIGN4PScwJyBjeT0nMCcgcj0nMTAwJy8+PC9nPjwvc3ZnPg=="
];

/**
 * Returns a deterministic background pattern based on object properties
 * @param item - The object with id and name/title properties
 * @param theme - Optional theme name ('galaxy' or 'gem')
 * @returns A URL string pointing to a background image or SVG pattern
 */
export function getDeterministicBgPattern(item: any, theme: string = 'galaxy'): string {
    // Check if item is a playlist (has playlist_name property)
    const isPlaylist = !!item.playlist_name;

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

    // For playlists, use the base64 SVG patterns based on theme
    if (isPlaylist) {
        if (theme === 'gem') {
            const patternIndex = Math.abs(hash) % gemThemePatternBase64.length;
            return gemThemePatternBase64[patternIndex];
        } else {
            const patternIndex = Math.abs(hash) % patternBase64.length;
            return patternBase64[patternIndex];
        }
    } else {
        // For meditations, use the background images
        const index = Math.abs(hash) % bgPatterns.length;
        return bgPatterns[index];
    }
}

/**
 * Assigns background patterns to an array of items (meditations or playlists)
 * @param items - Array of meditation or playlist objects
 * @param theme - Optional theme name ('galaxy' or 'gem')
 * @returns A new array of items with bgPattern property added
 */
export function assignBackgrounds(items: any[], theme: string = 'galaxy'): any[] {
    if (!items) return [];
    return items.map((item) => ({
        ...item,
        bgPattern: getDeterministicBgPattern(item, theme)
    }));
} 