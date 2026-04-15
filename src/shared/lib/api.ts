import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`Sem conexão com a API (${BASE_URL}). Verifique se o backend está rodando.`);
  }

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

export const apiPost = (path: string, body?: unknown): Promise<any> =>
  apiFetch(path, body === undefined ? { method: 'POST' } : { method: 'POST', body: JSON.stringify(body) });

export const apiPut = (path: string, body: unknown): Promise<any> =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = (path: string): Promise<any> =>
  apiFetch(path, { method: 'DELETE' });

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86_400_000);
    const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (txDay.getTime() === today.getTime()) return `Hoje, ${time}`;
    if (txDay.getTime() === yesterday.getTime()) return `Ontem, ${time}`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + `, ${time}`;
  } catch {
    return dateStr;
  }
}
