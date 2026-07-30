import { clearAuthSession, getAuthSession, updateAuthTokens } from './authStorage';
import type { ApiResponse, AuthResponse } from './types';

const configuredApiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:9191').replace(/\/$/, '');
const API_URL = import.meta.env.DEV ? '' : configuredApiUrl;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? `HTTP ${response.status}`, response.status, payload?.data);
  }
  return payload;
};

const refreshSession = async (): Promise<boolean> => {
  const session = getAuthSession();
  if (!session?.refreshToken || !session.sessionId) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        refreshToken: session.refreshToken,
      }),
    });
    const payload = await parseResponse<AuthResponse>(response);
    if (!payload.data.token || !payload.data.refreshToken || !payload.data.sessionId) return false;
    updateAuthTokens(payload.data.token, payload.data.refreshToken, payload.data.sessionId);
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
};

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  retryAuth?: boolean;
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { body, auth = true, retryAuth = true, headers, ...init } = options;
  const session = getAuthSession();
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (auth && session?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        'Không thể kết nối máy chủ VietStage. Vui lòng kiểm tra backend đang chạy.',
        0,
        error,
      );
    }
    throw error;
  }

  if (response.status === 401 && auth && retryAuth) {
    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null;
    });
    if (await refreshPromise) {
      return apiRequest<T>(path, { ...options, retryAuth: false });
    }
    window.dispatchEvent(new Event('vietstage:unauthorized'));
    window.location.assign('/login');
  }

  if (response.status === 204) return undefined as T;
  return (await parseResponse<T>(response)).data;
};
