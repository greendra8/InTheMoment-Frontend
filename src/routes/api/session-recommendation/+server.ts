import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverGetSessionRecommendation } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Check if user is authenticated
        // This would typically use locals.session, but we're keeping it simple for now

        // Get the messages from the request
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Get the session recommendation
        const recommendation = await serverGetSessionRecommendation(messages);

        return json({ content: recommendation });
    } catch (error) {
        console.error('Error in session-recommendation endpoint:', error);
        return json({ error: 'Failed to get session recommendation' }, { status: 500 });
    }
}; 