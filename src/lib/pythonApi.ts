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
    let errorDetail = response.statusText; // Default error message
    let errorStatus = response.status;
    try {
      // Attempt to parse the JSON error response from FastAPI
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        // Use the detail message from FastAPI if available
        errorDetail = errorData.detail;
      }
    } catch (parseError) {
      // If parsing fails, log it but stick with the statusText
      console.warn('Could not parse error response body:', parseError);
      // Fallback to raw text if JSON parsing fails but body exists
      try {
        const rawErrorText = await response.text();
        if (rawErrorText) {
          errorDetail = rawErrorText;
        }
      } catch (textError) {
        console.warn('Could not read error response text:', textError);
      }
    }

    console.error('Error response from Python API:', errorStatus, errorDetail);
    // Throw an error containing the status and the specific detail message
    const error = new Error(errorDetail);
    // Add status property for potential use in server action
    (error as any).status = errorStatus;
    throw error;
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