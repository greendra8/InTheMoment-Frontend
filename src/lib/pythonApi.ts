// const PYTHON_SERVER_URL = 'http://localhost:8000';
const PYTHON_SERVER_URL = 'https://aiwellbeingfastapi.onrender.com';

export async function generateMeditation(length: number, accessToken: string) {
  // Get the current local time and format it
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date()).replace(/\s/g, ''); // Remove space between time and AM/PM

  const response = await fetch(`${PYTHON_SERVER_URL}/generate_meditation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ 
      length,
      userLocalTime: formattedTime 
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