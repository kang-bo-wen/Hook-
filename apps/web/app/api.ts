const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('hook_token')?.trim() || null;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Session-Token', token);
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join('、') : body?.message;
    if (response.status === 401 && typeof window !== 'undefined') window.localStorage.removeItem('hook_token');
    throw new ApiError(message ?? '请求失败，请稍后再试', response.status);
  }
  return body as T;
}

export type AuthResponse = { token: string; user: { id: string; email: string; profile: { nickname: string | null } | null } };
