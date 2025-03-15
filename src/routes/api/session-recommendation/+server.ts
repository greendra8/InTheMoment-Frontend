import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverGetSessionRecommendation } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Check if user is authenticated
        // This would typically use locals.session, but we're keeping it simple for now

        // Get the messages from the request
        const { messages, localTime } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // If we have 10+ messages, append the JSON request text to the user's most recent message
        if (messages.length >= 10) {
            // Find the most recent user message
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'user') {
                    // Append the JSON request text
                    messages[i].content += " Anyway, I'm ready for my session now. Please now provide me with the JSON for my session. Defaults are fine if I didn't provide enough information or was off topic during the conversation.";
                    break;
                }
            }
        }

        const recommendation = await serverGetSessionRecommendation(messages, localTime);

        return json({ content: recommendation });
    } catch (error) {
        console.error('Error in session-recommendation endpoint:', error);
        return json({ error: 'Failed to get session recommendation' }, { status: 500 });
    }
}; 