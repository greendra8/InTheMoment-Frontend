// Time-related utility functions

export const TIMEZONE_OFFSET_COOKIE = 'user_timezone_offset';

/**
 * Gets the user's timezone offset in minutes from UTC
 * @returns Timezone offset in minutes
 */
export function getUserTimezoneOffset(): number {
    if (typeof window === 'undefined') return 0;
    return new Date().getTimezoneOffset();
}

/**
 * Sets the timezone offset cookie
 */
export function setTimezoneOffsetCookie(): void {
    if (typeof document === 'undefined') return;

    const offset = getUserTimezoneOffset();
    const expires = new Date();
    expires.setTime(expires.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    document.cookie = `${TIMEZONE_OFFSET_COOKIE}=${offset};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * Adjusts a server date to the user's local timezone based on offset
 * @param date The date to adjust
 * @param offsetMinutes Timezone offset in minutes
 * @returns Date adjusted to user's timezone
 */
export function adjustToUserTimezone(date: Date, offsetMinutes: number): Date {
    const serverOffset = date.getTimezoneOffset();
    const userOffset = offsetMinutes;
    const offsetDiff = serverOffset - userOffset;

    // Create new date to avoid mutating the original
    const adjustedDate = new Date(date);
    adjustedDate.setMinutes(adjustedDate.getMinutes() + offsetDiff);

    return adjustedDate;
}

/**
 * Determines the time of day (morning, midday, evening) based on hour
 * @param hour Hour in 24-hour format
 * @returns Time of day as a string
 */
export function getTimeOfDayFromHour(hour: number): string {
    if (hour >= 3 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'midday';
    return 'evening';
} 