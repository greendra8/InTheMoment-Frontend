import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverTranscribeAudio } from '$lib/server/supabase';

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

        // Get the audio blob from the request
        const formData = await request.formData();
        const audioFile = formData.get('file') as File;

        if (!audioFile) {
            return json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Convert the file to a buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Transcribe the audio with retry mechanism
        const transcription = await withRetry(() => serverTranscribeAudio(buffer));

        // add the string "transcription: " to the beginning of the transcription
        const transcriptionWithPrefix = `transcription: ${transcription}`;

        return json({ text: transcriptionWithPrefix });
    } catch (error) {
        console.error('Error in transcribe endpoint after retries:', error);

        // Check if this is an authentication error we threw
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return json({ error: error.message }, { status: 401 });
        }

        return json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }
}; 