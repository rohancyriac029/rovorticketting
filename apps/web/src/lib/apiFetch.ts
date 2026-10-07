import type { ApiErrorBody } from '@app/shared';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // ignore parse failure, fall through to generic error
    }
    const err = body?.error;
    throw new ApiError(
      err?.code ?? 'UNKNOWN_ERROR',
      res.status,
      err?.message ?? `Request failed with status ${res.status}`,
      err?.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
