export async function callAIEndpoint(endpoint: string, payload: object) {
  try {
    // In server-side Next.js, fetch requires an absolute URL.
    // Prefix relative paths with the site base URL.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : endpoint;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('API Route Error:', {
        error: data.error,
        details: data.details,
      });
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
