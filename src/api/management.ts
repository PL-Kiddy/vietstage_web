import { apiRequest, type RequestOptions } from './client';
import type { Instrument, Lesson, SkillLevel } from './types';

export interface DashboardChartPoint {
  name: string;
  users: number;
  revenue: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  totalLessons: number;
  activeInstructors: number;
  chartData: DashboardChartPoint[];
}

export interface UserProfile {
  id: number;
  userCode: string;
  email: string;
  fullName: string;
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
  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest<UserProfile>('/api/users/me/avatar', {
      method: 'POST',
      body: formData as any,
    });
  },
  changePassword: (oldPassword: string, newPassword: string) =>
    apiRequest<void>('/api/users/me/change-password', {
      method: 'PUT',
      body: { oldPassword, newPassword },
    }),
};

// Notification type
export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Notification API
export const notificationApi = {
  // Lấy danh sách thông báo, có thể filter bằng isRead, page, size
  list: (options?: RequestOptions) =>
    apiRequest<Notification[]>('/api/notifications', options),
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

