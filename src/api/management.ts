import { apiRequest, type RequestOptions } from './client';
import type { Instrument, Lesson, SkillLevel } from './types';

export interface DashboardStats {
  /** Số người dùng hoạt động trong khoảng thời gian mà API trả về. */
  activeUsers?: number;
  popularInstruments?: Array<{
    instrumentId?: number;
    instrumentName?: string;
    name?: string;
    practiceCount?: number;
    value?: number;
  }>;
  sessionDuration?: Array<{
    period?: string;
    name?: string;
    averageDurationMinutes?: number;
    totalDurationMinutes?: number;
    value?: number;
  }>;
  retention?: Array<{
    period?: string;
    name?: string;
    retentionRate?: number;
    value?: number;
  }>;
}

export interface UserProfile {
  id: number;
  userCode: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface Technique {
  id: number;
  name: string;
  description?: string;
  guide_url?: string;
  instrument_id: number;
}

export interface InstrumentInput {
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface SkillLevelInput {
  levelCode: string;
  levelName: string;
  orderIndex: number;
}

export interface TechniqueInput {
  name: string;
  description?: string;
  guide_url?: string;
  instrument_id: number;
}

export type TechniqueUpdateInput = Omit<TechniqueInput, 'instrument_id'>;

export const dashboardApi = {
  get: (options?: RequestOptions) => apiRequest<DashboardStats>('/api/admin/dashboard', options),
};

export const profileApi = {
  get: (options?: RequestOptions) => apiRequest<UserProfile>('/api/users/me', options),
  update: (fullName: string) =>
    apiRequest<UserProfile>('/api/users/me', {
      method: 'PUT',
      body: { fullName },
    }),
  updateAvatar: async (file: File, fullName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const avatarUrl = await apiRequest<string>('/api/upload', {
      method: 'POST',
      body: formData,
    });
    return apiRequest<UserProfile>('/api/users/me', {
      method: 'PUT',
      body: { fullName: fullName || 'User', avatarUrl },
    });
  },
  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) =>
    apiRequest<void>('/api/users/me/password', {
      method: 'PUT',
      body: { oldPassword, newPassword, confirmPassword },
    }),
};

// Notification type
export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  read: boolean;       // mapped from is_read
  is_read?: boolean;   // raw field from API
  createdAt: string;
  created_at?: string; // raw field from API
}

// Internal helper to normalize API notification object
const normalizeNotification = (n: any): Notification => ({
  id: n.id,
  title: n.title || '',
  message: n.message || '',
  type: n.type,
  read: n.is_read ?? n.read ?? false,
  is_read: n.is_read,
  createdAt: n.created_at || n.createdAt || '',
  created_at: n.created_at,
});

// Notification API
export const notificationApi = {
  // Lấy danh sách thông báo — backend trả về { data: [...], page, size, total, unread_count }
  list: async (options?: RequestOptions): Promise<Notification[]> => {
    const raw = await apiRequest<any>('/api/notifications', options);
    // Handle direct array, single nested { data: [...] }, or double nested { data: { data: [...] } } envelope
    const arr: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data?.data)
      ? raw.data.data
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    return arr.map(normalizeNotification);
  },
  // Đánh dấu một thông báo đã đọc
  markAsRead: (id: number) =>
    apiRequest<void>(`/api/notifications/${id}`, { method: 'PUT' }),
  // Đánh dấu tất cả đã đọc
  markAllAsRead: () =>
    apiRequest<void>('/api/notifications', { method: 'PUT' }),
};

export const instrumentManagementApi = {
  list: () => apiRequest<Instrument[]>('/api/instruments'),
  get: (id: number) =>
    apiRequest<Instrument>(`/api/instruments/${id}`),
  techniques: (id: number) =>
    apiRequest<Technique[]>(`/api/instruments/${id}/techniques`),
  create: (body: InstrumentInput) =>
    apiRequest<Instrument>('/api/instruments', { method: 'POST', body }),
  update: (id: number, body: InstrumentInput) =>
    apiRequest<Instrument>(`/api/instruments/${id}`, { method: 'PUT', body }),
  remove: (id: number) =>
    apiRequest<void>(`/api/instruments/${id}`, { method: 'DELETE' }),
};

export const skillLevelManagementApi = {
  list: () => apiRequest<SkillLevel[]>('/api/skill-levels'),
  get: (id: number) =>
    apiRequest<SkillLevel>(`/api/skill-levels/${id}`),
  create: (body: SkillLevelInput) =>
    apiRequest<SkillLevel>('/api/skill-levels', { method: 'POST', body }),
  update: (id: number, body: SkillLevelInput) =>
    apiRequest<SkillLevel>(`/api/skill-levels/${id}`, { method: 'PUT', body }),
  remove: (id: number) =>
    apiRequest<void>(`/api/skill-levels/${id}`, { method: 'DELETE' }),
};

export const techniqueManagementApi = {
  list: (instrumentId?: number) => {
    const query = instrumentId ? `?instrument_id=${instrumentId}` : '';
    return apiRequest<Technique[]>(`/api/techniques${query}`);
  },
  get: (id: number) =>
    apiRequest<Technique>(`/api/techniques/${id}`),
  create: (body: TechniqueInput) =>
    apiRequest<Technique>('/api/techniques', { method: 'POST', body }),
  update: (id: number, body: TechniqueUpdateInput) =>
    apiRequest<Technique>(`/api/techniques/${id}`, { method: 'PUT', body }),
  remove: (id: number) =>
    apiRequest<void>(`/api/techniques/${id}`, { method: 'DELETE' }),
};

export const lessonDetailApi = {
  get: (id: number) => apiRequest<Lesson>(`/api/lessons/${id}`),
};

