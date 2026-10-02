const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 30_000;

export interface ChatResponse {
  answer: string;
  source: string;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  if (!response.ok) {
    // NestJS errors look like: { statusCode, message: string | string[], error }
    const body = await response.json().catch(() => null);
    const detail = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(detail ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as ChatResponse;
}
