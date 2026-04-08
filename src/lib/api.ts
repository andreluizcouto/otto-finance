import { getToken } from './auth';

const BASE_URL = 'http://localhost:8001';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return response.json();
}

export const apiGet = (path: string): Promise<any> =>
  apiFetch(path, { method: 'GET' });

export const apiPost = (path: string, body: unknown): Promise<any> =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPut = (path: string, body: unknown): Promise<any> =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
