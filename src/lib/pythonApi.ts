// const PYTHON_SERVER_URL = 'http://localhost:8000';
const PYTHON_SERVER_URL = 'https://aiwellbeingfastapi.onrender.com';

export async function generateMeditation(accessToken: string, length: number, userLocalTime: string, parameters: any) {
  const response = await fetch(`${PYTHON_SERVER_URL}/generate_meditation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ 
      length,
      userLocalTime,
      parameters
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', response.status, errorText);
    throw new Error(`Failed to generate meditation: ${response.statusText}`);
  }

  return await response.json();
}

// Remove the getMeditationStatus function from here