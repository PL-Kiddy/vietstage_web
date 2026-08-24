import { apiRequest, type RequestOptions } from './client';
import type {
  AdminUser,
  AuthResponse,
  Instrument,
  Lesson,
  PageResponse,
  ReviewItem,
  SkillLevel,
  PracticeAttemptDetailResponse,
  FeedbackResponse,
  LessonAsset,
  InstructorLearner,
  AdminDashboardStats,
  DashboardGranularity,
  InstructorCreateRequest,
  InstructorCreateResponse,
} from './types';

// ── Auth: đăng nhập, đăng ký, quên mật khẩu, đăng xuất ──
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

// ── Admin quản lý người dùng (danh sách, sửa, đổi role/status, reset mật khẩu, tạo giảng viên) ──
export const usersApi = {
  list: (options?: RequestOptions) => apiRequest<PageResponse<AdminUser>>('/api/admin/users', options),
  updateProfile: (id: number, body: { fullName: string; avatarUrl?: string }) =>
    apiRequest<void>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body,
    }),
  updateRole: (id: number, role: 'LEARNER' | 'INSTRUCTOR') =>
    apiRequest<void>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: { role },
    }),
  updateStatus: (id: number, status: 'ACTIVE' | 'LOCKED') =>
    apiRequest<void>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: { status },
    }),
  resetAdminPassword: (id: number, newPassword: string) =>
    apiRequest<void>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: { newPassword },
    }),
  createInstructor: (body: InstructorCreateRequest) =>
    apiRequest<InstructorCreateResponse>('/api/admin/create-instructor', { method: 'POST', body }),
};

// ── Master data: danh sách nhạc cụ và trình độ ──
export const masterDataApi = {
  instruments: (options?: RequestOptions) => apiRequest<Instrument[]>('/api/instruments', options),
  skillLevels: (options?: RequestOptions) => apiRequest<SkillLevel[]>('/api/skill-levels', options),
};

export interface AppConfig {
  key: string;
  value: string;
  description?: string;
  valueType?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string;
  defaultValue?: string;
  version?: number;
  config_group?: string;
  updated_by?: string;
  updated_at?: string;
}

// ── Cấu hình hệ thống (AdminSettings): đọc theo group, cập nhật theo key kèm version (optimistic lock) ──
export const appConfigsApi = {
  list: (group?: string, options?: RequestOptions) => {
    const query = group ? `?group=${encodeURIComponent(group)}` : '';
    return apiRequest<AppConfig[]>(`/api/admin/configs${query}`, options);
  },
  update: (key: string, value: string, version: number, options?: RequestOptions) =>
    apiRequest<AppConfig>(`/api/admin/configs/${encodeURIComponent(key)}`, {
      ...options,
      method: 'PUT',
      body: { value, version },
    }),
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

// ── Bài học (lesson): CRUD + cập nhật trạng thái ──
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

// ── Bài tập (exercise): tạo mới theo lesson (chỉ có create ở đây, CRUD đầy đủ ở lessonContent.ts) ──
export const exercisesApi = {
  // POST /api/lessons/{id}/exercises
  create: (lessonId: number, body: ExerciseInput) =>
    apiRequest<{ id: number; lessonId: number; title: string; description: string; beatMapAssetId: number; passThreshold: number; orderIndex: number }>(
      `/api/lessons/${lessonId}/exercises`,
      { method: 'POST', body }
    ),
};

// ── Kiểm duyệt học liệu (AdminReview): danh sách + phê duyệt/từ chối ──
export const reviewsApi = {
  list: (params?: URLSearchParams, options?: RequestOptions) =>
    apiRequest<PageResponse<ReviewItem>>(`/api/admin/reviews${params && params.size > 0 ? `?${params.toString()}` : ''}`, options),
  approve: (id: number) =>
    apiRequest<void>(`/api/admin/reviews/${id}/approve`, { method: 'POST' }),
  reject: (id: number, feedback: string) =>
    apiRequest<void>(`/api/admin/reviews/${id}/reject`, {
      method: 'POST',
      body: { feedback },
    }),
};

// ── Tiến độ học viên (learner) ──
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

// ── Giảng viên: danh sách học viên, lượt luyện tập, phản hồi theo attempt ──
export const instructorStudentsApi = {
  // Returns only learners the authenticated instructor is allowed to monitor.
  listStudents: (page = 0, size = 100, search?: string, options?: RequestOptions) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search?.trim()) params.set('search', search.trim());
    return apiRequest<PageResponse<InstructorLearner>>(`/api/instructor/learners?${params.toString()}`, options);
  },

  // Instructor-scoped attempt history. Do not use the learner-facing lesson
  // attempt endpoint here; it returns 403 for an instructor session.
  getInstructorAttempts: (
    filters: {
      learnerId?: number;
      lessonId?: number;
      fromDate?: string;
      toDate?: string;
      page?: number;
      size?: number;
    },
    options?: RequestOptions,
  ) => {
    const params = new URLSearchParams();
    if (filters.learnerId !== undefined) params.set('learnerId', String(filters.learnerId));
    if (filters.lessonId !== undefined) params.set('lessonId', String(filters.lessonId));
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    params.set('page', String(filters.page ?? 0));
    params.set('size', String(filters.size ?? 100));
    return apiRequest<PageResponse<PracticeAttemptDetailResponse>>(`/api/instructor/practice-attempts?${params.toString()}`, options);
  },

  // OpenAPI: GET /api/practice/attempts/{attemptId}/feedback
  getFeedbacks: (attemptId: number, options?: RequestOptions) =>
    apiRequest<FeedbackResponse[] | PageResponse<FeedbackResponse>>(`/api/practice/attempts/${attemptId}/feedback`, options),

  // OpenAPI: POST /api/practice/attempts/{attemptId}/feedback
  sendFeedback: (attemptId: number, comment: string) =>
    apiRequest<FeedbackResponse>(`/api/practice/attempts/${attemptId}/feedback`, {
      method: 'POST',
      body: { comment },
    }),
};

// ── Upload file chung lên Cloudinary ──
export const uploadApi = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<string>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// ── Kỹ thuật gắn với bài học (POST /api/lessons/{id}/techniques) ──
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

// ── Media assets của bài học: danh sách, upload (REFERENCE_AUDIO/SHEET_MUSIC), xóa ──
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
      body: formData,
    });
  },

  deleteAsset: (lessonId: number, assetId: number, options?: RequestOptions) =>
    apiRequest<void>(`/api/lessons/${lessonId}/assets/${assetId}`, {
      ...options,
      method: 'DELETE',
    }),
};

export interface LessonContent {
  id: number;
  content_text: string;
  order_index: number;
}

export interface LessonContentInput {
  content_text: string;
  order_index: number;
}

export const lessonContentsApi = {
  list: (lessonId: number, options?: RequestOptions) =>
    apiRequest<LessonContent[]>(`/api/lessons/${lessonId}/contents`, options),
  create: (lessonId: number, body: LessonContentInput, options?: RequestOptions) =>
    apiRequest<LessonContent>(`/api/lessons/${lessonId}/contents`, {
      ...options,
      method: 'POST',
      body,
    }),
  update: (lessonId: number, contentId: number, body: LessonContentInput, options?: RequestOptions) =>
    apiRequest<LessonContent>(`/api/lessons/${lessonId}/contents/${contentId}`, {
      ...options,
      method: 'PUT',
      body,
    }),
  remove: (lessonId: number, contentId: number, options?: RequestOptions) =>
    apiRequest<void>(`/api/lessons/${lessonId}/contents/${contentId}`, {
      ...options,
      method: 'DELETE',
    }),
};

// ── Dashboard Admin: thống kê theo khoảng ngày và mức granularity (DAY/WEEK/MONTH) ──
export const adminDashboardApi = {
  get: (
    params: { fromDate: string; toDate: string; granularity: DashboardGranularity },
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams({
      fromDate: params.fromDate,
      toDate: params.toDate,
      granularity: params.granularity,
    });
    return apiRequest<AdminDashboardStats>(`/api/admin/dashboard?${query.toString()}`, options);
  },
};

// ── Vật phẩm trang trí (Cosmetics): CRUD dành cho Admin ──
// Entity backend: CosmeticItem { id, name, itemType, assetUrl, unlockType, unlockValue }
// itemType: ROOM_DECOR | INSTRUMENT_SKIN | AVATAR_SKIN
// unlockType: ACHIEVEMENT | STARS | POINTS | DEFAULT

export interface CosmeticItem {
  id: number;
  name: string;
  itemType: 'ROOM_DECOR' | 'INSTRUMENT_SKIN' | 'AVATAR_SKIN' | string;
  assetUrl?: string;
  unlockType: 'ACHIEVEMENT' | 'STARS' | 'POINTS' | 'DEFAULT' | string;
  unlockValue?: number;
  status?: 'ACTIVE' | 'INACTIVE' | string;
}

export interface CosmeticRequest {
  name: string;
  itemType: string;
  assetUrl?: string;
  unlockType: string;
  unlockValue?: number;
  status?: string;
}

export const cosmeticsApi = {
  // GET /api/cosmetics?item_type=ROOM_DECOR
  list: (itemType?: string, options?: RequestOptions) => {
    const query = itemType ? `?item_type=${encodeURIComponent(itemType)}` : '';
    return apiRequest<CosmeticItem[]>(`/api/cosmetics${query}`, options);
  },
  // POST /api/admin/cosmetics  ← Admin endpoint (backend cần thêm)
  create: (body: CosmeticRequest, options?: RequestOptions) =>
    apiRequest<CosmeticItem>('/api/admin/cosmetics', { ...options, method: 'POST', body }),
  // PUT /api/admin/cosmetics/{id}  ← Admin endpoint (backend cần thêm)
  update: (id: number, body: CosmeticRequest, options?: RequestOptions) =>
    apiRequest<CosmeticItem>(`/api/admin/cosmetics/${id}`, { ...options, method: 'PUT', body }),
  // DELETE /api/admin/cosmetics/{id}  ← Admin endpoint (backend cần thêm)
  remove: (id: number, options?: RequestOptions) =>
    apiRequest<void>(`/api/admin/cosmetics/${id}`, { ...options, method: 'DELETE' }),
};
