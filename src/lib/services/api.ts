import { supabase } from '$lib/supabase';

export const API_BASE_URL = 'http://localhost:8000';

export async function getMeditations(userId: string, params: Record<string, string> = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/meditations/${userId}${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch meditations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching meditations:', error);
    throw error;
  }
}

export async function getSingleMeditation(meditationId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/meditation/${meditationId}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Meditation not found');
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching meditation:', error);
    throw error;
  }
}

export async function generateMeditation(length: number, accessToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate_meditation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ length }),
    });
    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error generating meditation:', error);
    throw error;
  }
}

// Keep other existing functions (generateLLMResponse, textToSpeech) as they are