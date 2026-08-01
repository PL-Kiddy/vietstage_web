import { apiRequest, type RequestOptions } from './client';
import type {
  AdminUser,
  AuthResponse,
  Instrument,
  Lesson,
  PageResponse,
  ReviewItem,
  SkillLevel,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  register: (email: string, password: string, fullName: string) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, fullName },
      auth: false,
    }),
  verifyRegistration: (email: string, otpCode: string) =>
    apiRequest<AuthResponse>('/api/auth/verify-registration', {
      method: 'POST',
      body: { email, otpCode },
      auth: false,
    }),
  forgotPassword: (email: string) =>
    apiRequest<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }),
  resetPassword: (email: string, verificationCode: string, newPassword: string) =>
    apiRequest<void>('/api/auth/reset-password', {
      method: 'POST',
      body: { email, verificationCode, newPassword },
      auth: false,
    }),
  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
};

export const usersApi = {
  list: (options?: RequestOptions) => apiRequest<AdminUser[]>('/api/admin/users', options),
  updateStatus: (id: number, status: 'active' | 'locked') =>
    apiRequest<void>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: { status },
    }),
  createInstructor: (body: {
    email: string;
    password: string;
    fullName: string;
    biography?: string;
    yearsExperience?: number;
  }) => apiRequest('/api/admin/create-instructor', { method: 'POST', body }),
  createAdmin: (body: { email: string; password: string; fullName: string }) =>
    apiRequest('/api/admin/create-admin', { method: 'POST', body }),
};

export const masterDataApi = {
  instruments: (options?: RequestOptions) => apiRequest<Instrument[]>('/api/instruments', options),
  skillLevels: (options?: RequestOptions) => apiRequest<SkillLevel[]>('/api/skill-levels', options),
};

export interface LessonInput {
  title: string;
  description?: string;
  skillLevelId?: number;
  instrumentId: number;
  status?: 'DRAFT' | 'PENDING';
  orderIndex?: number;
  exercises?: string[];
  passThreshold?: number;
}

export const lessonsApi = {
  list: (params: URLSearchParams, options?: RequestOptions) =>
    apiRequest<PageResponse<Lesson>>(`/api/lessons?${params.toString()}`, options),
  create: (body: LessonInput) => apiRequest<Lesson>('/api/lessons', { method: 'POST', body }),
  update: (
    id: number,
    body: Pick<LessonInput, 'title' | 'description' | 'skillLevelId' | 'orderIndex' | 'exercises' | 'passThreshold'>,
  ) => apiRequest<Lesson>(`/api/lessons/${id}`, {
    method: 'PUT',
    body: {
      title: body.title,
      description: body.description,
      skill_level_id: body.skillLevelId,
      order_index: body.orderIndex,
    },
  }),
  updateStatus: (id: number, status: 'DRAFT' | 'PENDING') =>
    apiRequest(`/api/lessons/${id}/status`, { method: 'PUT', body: { status } }),
  remove: (id: number) => apiRequest<void>(`/api/lessons/${id}`, { method: 'DELETE' }),
};

export const reviewsApi = {
  list: (options?: RequestOptions) => apiRequest<ReviewItem[]>('/api/admin/reviews', options),
  approve: (id: number) =>
    apiRequest<void>(`/api/admin/reviews/${id}/approve`, { method: 'POST' }),
  reject: (id: number, feedback: string) =>
    apiRequest<void>(`/api/admin/reviews/${id}/reject`, {
      method: 'POST',
      body: { feedback },
    }),
};
