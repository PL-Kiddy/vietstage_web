import axios from 'axios';
import type { AxiosRequestConfig, Method } from 'axios';
import { clearAuthSession, getAuthSession, updateAuthTokens } from './authStorage';
import type { ApiResponse, AuthResponse } from './types';

const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const API_URL = import.meta.env.DEV ? '' : configuredApiUrl;

const axiosClient = axios.create({
  baseURL: API_URL || undefined,
  headers: {
    Accept: 'application/json',
  },
});

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

const TECHNICAL_ERROR_PATTERN = /\b(jdbc|sql|exception|stack trace|syntax error|relation|column|constraint|hibernate|select |insert |update |delete from)\b/i;

const getSafeErrorMessage = (status: number, message?: string): string => {
  if (status >= 500) return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.';
  if (message && !TECHNICAL_ERROR_PATTERN.test(message)) return message;
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
};

let refreshPromise: Promise<boolean> | null = null;

const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data as ApiEnvelope<unknown> | undefined;
    if (!error.response) {
      return new ApiError(
        'Không thể kết nối hệ thống. Vui lòng kiểm tra mạng và thử lại.',
        0,
        error,
      );
    }
    return new ApiError(
      getSafeErrorMessage(status, payload?.message),
      status,
      status >= 500 ? undefined : payload?.data,
    );
  }

  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(error instanceof Error ? error.message : 'Unknown API error', 0, error);
};

const unwrapResponse = <T>(payload: ApiEnvelope<T> | null | undefined, status: number): T => {
  if (!payload) {
    throw new ApiError(`HTTP ${status}`, status);
  }

  if (payload.success === false) {
    throw new ApiError(payload.message ?? `HTTP ${status}`, status, payload.data);
  }

  return payload.data as T;
};

const refreshSession = async (): Promise<boolean> => {
  const session = getAuthSession();
  if (!session?.refreshToken || !session.sessionId) return false;

  try {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/api/auth/refresh', {
      sessionId: session.sessionId,
      refreshToken: session.refreshToken,
    });

    const data = unwrapResponse<AuthResponse>(response.data, response.status);
    if (!data.token || !data.refreshToken || !data.sessionId) return false;
    updateAuthTokens(data.token, data.refreshToken, data.sessionId);
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
};

export interface RequestOptions extends Omit<AxiosRequestConfig, 'url' | 'data' | 'method' | 'auth'> {
  method?: Method;
  body?: unknown;
  auth?: boolean;
  retryAuth?: boolean;
}

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { body, auth = true, retryAuth = true, headers, ...config } = options;
  const session = getAuthSession();
  const requestHeaders = {
    ...(headers ?? {}),
    Accept: 'application/json',
  } as Record<string, string>;

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth && session?.accessToken) {
    requestHeaders.Authorization = `Bearer ${session.accessToken}`;
  }

  try {
    const response = await axiosClient.request<ApiEnvelope<T>>({
      url: path,
      data: body,
      headers: requestHeaders,
      ...config,
    });

    if (response.status === 204) return undefined as T;
    return unwrapResponse<T>(response.data, response.status);
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError.status === 401 && auth && retryAuth) {
      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
      });

      if (await refreshPromise) {
        return apiRequest<T>(path, { ...options, retryAuth: false });
      }

      window.dispatchEvent(new Event('vietstage:unauthorized'));
      window.location.assign('/login');
    }

    throw apiError;
  }
};


