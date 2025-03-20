import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverHandleAIConversation } from '$lib/server/supabase';

// Helper function to retry failed operations
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);

            if (attempt < maxRetries - 1) {
                // Wait before retrying (with exponential backoff)
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
            }
        }
    }

    throw lastError;
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        const { session, user } = locals;

        if (!session || !user) {
            throw error(401, 'Unauthorized: Authentication required');
        }

        // Get the request data
        const requestData = await request.json();
        const { messages, mode = 'session-recommendation', localTime, sessionId } = requestData;

        if (!messages || !Array.isArray(messages)) {
            return json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Validate required parameters based on mode
        if (mode === 'session-recommendation' && !localTime) {
            return json({ error: 'localTime is required for session recommendations' }, { status: 400 });
        }

        // For session recommendation: If we have 10+ messages, append the JSON request text to the user's most recent message
        if (messages.length >= 10) {
            // Find the most recent user message
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === 'user') {
                    // Append the JSON request text
                    if (mode === 'session-recommendation') {
                        messages[i].content += " Anyway, I'm ready for my session now. Please now provide me with the JSON for my session. Defaults are fine if I didn't provide enough information or was off topic during the conversation.";
                    } else if (mode === 'feedback-conversation') {
                        messages[i].content += " Anyway, I'm ready for my feedback now. Please now provide me with the JSON for my feedback. A general feedback is fine if I didn't provide enough information or was off topic during the conversation.";
                    }
                    break;
                }
            }
        }


        // Handle AI conversation with retry mechanism
        const responseContent = await withRetry(() =>
            serverHandleAIConversation(messages, mode, { localTime, sessionId })
        );

        // Format response based on mode
        if (mode === 'session-recommendation') {
            return json({ content: responseContent });
        } else if (mode === 'feedback-conversation') {
            return json({ response: responseContent });
        } else {
            return json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
        }
    } catch (error) {
        console.error(`Error in AI conversation endpoint after retries:`, error);

        // Check if this is an authentication error we threw
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return json({ error: error.message }, { status: 401 });
        }

        return json({ error: 'Failed to process AI conversation' }, { status: 500 });
    }
}; 