export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type BackendRole = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
export type PortalRole = 'admin' | 'instructor' | 'learner';

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  sessionId?: string;
  userCode?: string;
  email?: string;
  fullName?: string;
  role?: BackendRole;
  message: string;
}

export interface CurrentUser {
  email: string;
  name: string;
  role: PortalRole;
  userCode?: string;
}

export interface AuthSession extends CurrentUser {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Giảng viên' | 'Người học';
  registeredAt: string;
  status: 'active' | 'locked';
  avatar?: string;
  initials?: string;
  specialty?: string;
  stats?: { courses: number; students: string; rating: number };
  instruments?: string[];
  activities?: { title: string; time: string }[];
}

export interface Instrument {
  id: number;
  instrumentCode?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  active?: boolean;
}

export interface SkillLevel {
  id: number;
  levelCode: string;
  levelName: string;
  orderIndex: number;
}

export interface Lesson {
  id: number;
  lessonCode?: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  orderIndex: number;
  skillLevel?: { id: number; levelName: string };
  instrument?: { id: number; instrumentCode?: string; name: string; iconUrl?: string };
  createdBy?: { id: number; fullName: string; role: string };
  createdAt?: string;
  updatedAt?: string;
  techniques?: { id: number; name: string; guideUrl?: string }[];
  mediaAssets?: {
    id: number;
    assetType: string;
    assetUrl: string;
    tempoBpm?: number;
    durationSec?: number;
  }[];
  exercises?: {
    id: number;
    title: string;
    description?: string;
    passThreshold?: number;
    orderIndex?: number;
  }[];
}

export interface ReviewItem {
  id: number;
  title: string;
  instrument: string;
  instructor: string;
  date: string;
  sheetMusicUrl: string;
  audioUrl: string;
  duration: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PracticeAttempt {
  id: number;
  session_id?: number;
  exercise_id?: number;
  pitch_score?: number;
  rhythm_score?: number;
  technique_score?: number;
  overall_score?: number;
  audio_url?: string;
  feedback_data?: string;
  createdAt: string;
  updatedAt?: string;
  // Giả định thêm thuộc tính lessonName vì UI cần hiển thị
  lessonName?: string;
  duration?: string;
}

export interface FeedbackResponse {
  id: number;
  content: string;
  createdAt: string;
}

export interface LessonAsset {
  id: number;
  type: string;
  url: string;
  tempo_bpm?: number;
  duration_sec?: number;
}

export interface DashboardStats {
  courses?: number;
  students?: number;
  rating?: number;
  totalLearners?: number;
  activeLessons?: number;
  completionRate?: number;
}
