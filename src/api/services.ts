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

export interface ExerciseInput {
  title: string;
  description?: string;
  beatMapAssetId?: number;
  passThreshold?: number; // e.g. 100
  orderIndex?: number;
}

export const exercisesApi = {
  // POST /api/lessons/{id}/exercises
  create: (lessonId: number, body: ExerciseInput) =>
    apiRequest<{ id: number; lessonId: number; title: string; description: string; beatMapAssetId: number; passThreshold: number; orderIndex: number }>(
      `/api/lessons/${lessonId}/exercises`,
      { method: 'POST', body }
    ),
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

export const learnerProgressApi = {
  // GET /api/lessons/{id}/learners/{learner_id}/progress
  getLessonLearnerProgress: (lessonId: number, learnerId: number, options?: RequestOptions) =>
    apiRequest<{
      lessonId: number;
      learnerId: number;
      stars: number;
      completed: boolean;
      totalPracticeAttempts: number;
      bestPracticeScore: number;
      totalQuizAttempts: number;
    }>(`/api/lessons/${lessonId}/learners/${learnerId}/progress`, options),

  // GET /api/users/{learnerId}/progress/summary or fallback endpoint
  getLearnerProgressSummary: (learnerId: number, options?: RequestOptions) =>
    apiRequest<{
      total_stars: number;
      completed_lessons: number;
      current_streak: number;
      longest_streak: number;
      total_points: number;
      adaptive_difficulty: number;
    }>(`/api/instructor/learners/${learnerId}/progress/summary`, options).catch(() =>
      // Fallback for demo: return default summary object
      Promise.resolve({
        total_stars: 0,
        completed_lessons: 0,
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        adaptive_difficulty: 1,
      })
    ),

  // GET /api/users/me/progress
  getMyProgress: (instrumentId?: number, skillLevelId?: number, options?: RequestOptions) => {
    const params = new URLSearchParams();
    if (instrumentId) params.append('instrument_id', String(instrumentId));
    if (skillLevelId) params.append('skill_level_id', String(skillLevelId));
    const query = params.toString();
    return apiRequest<{ lessonId: number; title: string; stars: number; completed: boolean }[]>(
      `/api/users/me/progress${query ? `?${query}` : ''}`,
      options
    );
  },

  // GET /api/users/me/progress/summary
  getMyProgressSummary: (options?: RequestOptions) =>
    apiRequest<{
      total_stars: number;
      completed_lessons: number;
      current_streak: number;
      longest_streak: number;
      total_points: number;
      adaptive_difficulty: number;
    }>('/api/users/me/progress/summary', options),
};

export const instructorStudentsApi = {
  listStudents: (options?: RequestOptions) => apiRequest<AdminUser[]>('/api/admin/users', options),
  
  // GET /api/lessons/{id}/attempts?learner_id={learnerId}
  getAttempts: (lessonId: number, learnerId: number, page = 0, size = 100, options?: RequestOptions) =>
    apiRequest<PageResponse<PracticeAttempt>>(
      `/api/lessons/${lessonId}/attempts?learner_id=${learnerId}&page=${page}&size=${size}`,
      options,
    ),
    
  // POST /api/practice-attempts/{attemptId}/feedbacks
  sendFeedback: (attemptId: number, content: string, type: string = 'TEXT') => 
    apiRequest<FeedbackResponse>(`/api/practice-attempts/${attemptId}/feedbacks`, {
      method: 'POST',
      body: { content, type }
    })
};

export const uploadApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<string>('/api/upload', {
      method: 'POST',
      body: formData as any,
    });
  },
};

export const lessonTechniquesApi = {
  list: (lessonId: number, options?: RequestOptions) =>
    apiRequest<{ id: number; name: string; description?: string }[]>(`/api/lessons/${lessonId}/techniques`, options),
  create: (lessonId: number, body: { name: string; description?: string }) =>
    apiRequest<{ id: number; name: string; description?: string }>(`/api/lessons/${lessonId}/techniques`, {
      method: 'POST',
      body,
    }),
  remove: (lessonId: number, techniqueId: number, options?: RequestOptions) =>
    apiRequest<void>(`/api/lessons/${lessonId}/techniques/${techniqueId}`, {
      ...options,
      method: 'DELETE',
    }),
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
    
    return apiRequest<LessonAsset>(url, {
      method: 'POST',
      body: formData as any
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
