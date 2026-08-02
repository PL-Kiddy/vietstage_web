import { apiRequest, type RequestOptions } from './client';
import type {
  AdminUser,
  AuthResponse,
  Instrument,
  Lesson,
  PageResponse,
  ReviewItem,
  SkillLevel,
  PracticeAttempt,
  FeedbackResponse,
  LessonAsset,
  DashboardStats,
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
  list: (options?: RequestOptions) => apiRequest<any>('/api/admin/users', { ...options, params: { size: 200, ...options?.params } }),
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

export const instructorStudentsApi = {
  // Using Admin endpoint as placeholder for now, assuming frontend will filter by role='LEARNER'
  listStudents: (options?: RequestOptions) => apiRequest<AdminUser[]>('/api/admin/users', options),
  
  // Fake endpoint based on Option A. Backend should implement /api/instructor/learners/{learnerId}/attempts
  getAttempts: (learnerId: number, options?: RequestOptions) => 
    apiRequest<PageResponse<PracticeAttempt>>(`/api/instructor/learners/${learnerId}/attempts`, options),
    
  sendFeedback: (attemptId: number, content: string, type: string) => 
    apiRequest<FeedbackResponse>('/api/feedback', {
      method: 'POST',
      body: { attemptId, content, type }
    })
};

export const lessonAssetsApi = {
  getAssets: (lessonId: number, options?: RequestOptions) =>
    apiRequest<LessonAsset[]>(`/api/lessons/${lessonId}/assets`, options),
    
  uploadAsset: (lessonId: number, file: File, type: string, tempoBpm?: number, durationSec?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    let url = `/api/lessons/${lessonId}/assets?type=${type}`;
    if (tempoBpm) url += `&tempo_bpm=${tempoBpm}`;
    if (durationSec) url += `&duration_sec=${durationSec}`;
    
    // Note: apiRequest needs to handle FormData without setting application/json
    return apiRequest<LessonAsset>(url, {
      method: 'POST',
      body: formData as any // The client.ts should ideally omit Content-Type for FormData
    });
  },
  
  deleteAsset: (lessonId: number, assetId: number, options?: RequestOptions) =>
    apiRequest<void>(`/api/lessons/${lessonId}/assets/${assetId}`, {
      ...options,
      method: 'DELETE',
    }),
};

export const instructorDashboardApi = {
  getStats: (options?: RequestOptions) =>
    apiRequest<DashboardStats>('/api/admin/dashboard', options),
};
