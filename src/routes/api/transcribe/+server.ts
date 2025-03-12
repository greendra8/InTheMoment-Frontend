import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverTranscribeAudio } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Check if user is authenticated
        // This would typically use locals.session, but we're keeping it simple for now

        // Get the audio blob from the request
        const formData = await request.formData();
        const audioFile = formData.get('file') as File;

        if (!audioFile) {
            return json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Convert the file to a buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Transcribe the audio
        const transcription = await serverTranscribeAudio(buffer);

        return json({ text: transcription });
    } catch (error) {
        console.error('Error in transcribe endpoint:', error);
        return json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }
}; 