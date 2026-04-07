'use client';

const ADMIN_BASE = '/api/admin';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(ADMIN_BASE + path, opts);
  if (res.status === 401) throw new ApiError('Session expired — please sign in again.', 401);
  if (res.status === 403) throw new ApiError('Access denied.', 403);
  const json = await res.json();
  if (!res.ok || !json.success) throw new ApiError(json.error || 'Request failed', res.status);
  return json.data as T;
}
