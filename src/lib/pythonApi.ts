const PYTHON_SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : 'https://api.inthemoment.app';

export async function generateMeditation(
  accessToken: string,
  length: number,
  userLocalTime: string,
  parameters: any,
  playlist_id?: number,
  content_type: string = 'meditation'
) {
  console.log('Sending to Python API:', {
    length,
    userLocalTime,
    parameters,
    playlist_id,
    content_type
  });

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
      playlist_id,
      content_type
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', response.status, errorText);
    throw new Error(`Failed to generate meditation: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Python API response:', result);

  return {
    type: 'success',
    data: {
      meditation_id: result.meditation_id,
      content_type: content_type,
      // Add any other properties you expect from the Python API
    }
  };
}