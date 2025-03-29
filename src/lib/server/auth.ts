// Server-side auth utilities
import { ADMIN_USER_ID } from '$env/static/private';

/**
 * Check if the current user is the admin
 * @param locals SvelteKit locals object containing session information
 * @returns boolean indicating if the user is the admin
 */
export function isAdminUser(locals: App.Locals): boolean {
    // Check if user is logged in and matches the admin ID
    return !!locals.session?.user?.id && locals.session.user.id === ADMIN_USER_ID;
} 