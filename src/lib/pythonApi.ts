const PYTHON_SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : 'https://api.inthemoment.app';

export async function generateMeditation(accessToken: string, length: number, userLocalTime: string, parameters: any, category_id: number) {
  const response = await fetch(`${PYTHON_SERVER_URL}/generate_meditation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ 
      length,
      userLocalTime,
      parameters,
      category_id
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', response.status, errorText);
    throw new Error(`Failed to generate meditation: ${response.statusText}`);
  }

  const result = await response.json();
  
  return {
    type: 'success',
    data: {
      meditation_id: result.meditation_id,
      // Add any other properties you expect from the Python API
    }
  };
}