const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('hook_token');
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? '请求失败，请稍后再试');
  return body as T;
}

export type AuthResponse = { token: string; user: { id: string; email: string; profile: { nickname: string | null } | null } };
