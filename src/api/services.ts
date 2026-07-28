import { apiRequest } from './client';
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
  forgotPassword: (email: string) =>
    apiRequest<string>('/api/auth/forgot-password', {
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
  list: () => apiRequest<AdminUser[]>('/api/admin/users'),
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
    instrumentIds?: number[];
  }) => apiRequest('/api/admin/create-instructor', { method: 'POST', body }),
  update: (
    id: number,
    body: { fullName: string; email: string; instrumentIds?: number[] },
  ) => apiRequest<void>(`/api/admin/users/${id}`, { method: 'PUT', body }),
  createAdmin: (body: { email: string; password: string; fullName: string }) =>
    apiRequest('/api/admin/create-admin', { method: 'POST', body }),
};

export const masterDataApi = {
  instruments: () => apiRequest<Instrument[]>('/api/instruments', { auth: false }),
  skillLevels: () => apiRequest<SkillLevel[]>('/api/skill-levels', { auth: false }),
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
  list: (params: URLSearchParams) =>
    apiRequest<PageResponse<Lesson>>(`/api/lessons?${params.toString()}`),
  create: (body: LessonInput) => apiRequest<Lesson>('/api/lessons', { method: 'POST', body }),
  update: (
    id: number,
    body: Pick<LessonInput, 'title' | 'description' | 'skillLevelId' | 'orderIndex' | 'exercises' | 'passThreshold'>,
  ) => apiRequest<Lesson>(`/api/lessons/${id}`, { method: 'PUT', body }),
  updateStatus: (id: number, status: 'DRAFT' | 'PENDING') =>
    apiRequest(`/api/lessons/${id}/status`, { method: 'PUT', body: { status } }),
  remove: (id: number) => apiRequest<void>(`/api/lessons/${id}`, { method: 'DELETE' }),
};

export const reviewsApi = {
  list: () => apiRequest<ReviewItem[]>('/api/admin/reviews'),
  approve: (id: number) =>
    apiRequest<void>(`/api/admin/reviews/${id}/approve`, { method: 'POST' }),
  reset: (id: number) =>
    apiRequest<void>(`/api/admin/reviews/${id}/pending`, { method: 'POST' }),
  reject: (id: number, feedback: string) =>
    apiRequest<void>(`/api/admin/reviews/${id}/reject`, {
      method: 'POST',
      body: { feedback },
    }),
};
