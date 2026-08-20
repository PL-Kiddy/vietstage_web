import { apiRequest, type RequestOptions } from './client';
import type { Instrument, Lesson, SkillLevel } from './types';

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

// ── Hồ sơ người dùng hiện tại (users/me): xem, sửa tên, đổi avatar (upload rồi PUT profile), đổi mật khẩu ──
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

interface RawNotification {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  createdAt?: string;
}

interface NotificationListResponse {
  data: RawNotification[];
  page: number;
  size: number;
  total: number;
  unread_count: number;
}

// Chuẩn hóa thông báo từ API (hỗ trợ cả is_read/read và created_at/createdAt)
const normalizeNotification = (n: RawNotification): Notification => ({
  id: n.id,
  title: n.title || '',
  message: n.message || '',
  type: n.type,
  read: n.is_read ?? n.read ?? false,
  is_read: n.is_read,
  createdAt: n.created_at || n.createdAt || '',
  created_at: n.created_at,
});

// ── Thông báo: danh sách, đánh dấu đã đọc 1 cái / tất cả ──
export const notificationApi = {
  // Lấy danh sách thông báo — backend trả về { data: [...], page, size, total, unread_count }
  list: async (options?: RequestOptions): Promise<Notification[]> => {
    const raw = await apiRequest<NotificationListResponse | RawNotification[]>('/api/notifications', options);
    // Handle direct array, single nested { data: [...] }, or double nested { data: { data: [...] } } envelope
    const arr = Array.isArray(raw) ? raw : raw.data ?? [];
    return arr.map(normalizeNotification);
  },
  // Đánh dấu một thông báo đã đọc
  markAsRead: (id: number) =>
    apiRequest<void>(`/api/notifications/${id}`, { method: 'PUT' }),
  // Đánh dấu tất cả đã đọc
  markAllAsRead: () =>
    apiRequest<void>('/api/notifications', { method: 'PUT' }),
};

// ── Quản lý nhạc cụ (master data, AdminMasterData) ──
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

// ── Quản lý trình độ (skill levels, master data) ──
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

// ── Quản lý kỹ thuật chơi nhạc cụ (master data) ──
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

// ── Chi tiết một bài học ──
export const lessonDetailApi = {
  get: (id: number) => apiRequest<Lesson>(`/api/lessons/${id}`),
};

