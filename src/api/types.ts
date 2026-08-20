// Envelope chuẩn của backend: { success, message, data }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Phân trang chuẩn backend (PageResponse)
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

// Response đăng nhập/refresh từ /api/auth/*
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

// Người dùng hiện tại (lưu trong session)
export interface CurrentUser {
  email: string;
  name: string;
  role: PortalRole;
  userCode?: string;
  avatar?: string;
}

/** Notification object returned by /api/notifications */
export interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string; // ISO date string
  read: boolean;
}

// Session đăng nhập đầy đủ (token + thông tin người dùng)
export interface AuthSession extends CurrentUser {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

// Người dùng trong danh sách quản lý (AdminUsers)
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  registeredAt: string;
  status: 'ACTIVE' | 'LOCKED';
  avatar?: string;
  initials?: string;
  specialty?: string;
  stats?: { courses: number; students: string; rating: number };
  instruments?: string[];
  activities?: { title: string; time: string }[];
}

/** Learner visible to the currently authenticated instructor. */
export interface InstructorLearner {
  id: number;
  fullName: string;
  email: string;
  userCode: string;
  instrumentName: string;
}

// Nhạc cụ
export interface Instrument {
  id: number;
  instrumentCode?: string;
  name: string;
  description?: string;
  iconUrl?: string;
  active?: boolean;
}

// Trình độ kỹ năng
export interface SkillLevel {
  id: number;
  levelCode: string;
  levelName: string;
  orderIndex: number;
}

// Bài học (lesson) — đầy đủ thông tin từ GET /api/lessons/{id}
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

// Học liệu chờ kiểm duyệt (AdminReview)
export interface ReviewItem {
  id: number;
  lessonId?: number;
  title: string;
  instrumentId?: number;
  instrument: string;
  instructorId?: number;
  instructor: string;
  date: string;
  assets?: {
    id: number;
    assetType: string;
    title?: string;
    assetUrl: string;
    mimeType?: string;
    durationSec?: number;
  }[];
  technicalNotes?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Lượt luyện tập của học viên (attempt)
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

// Attempt projection returned by GET /api/instructor/practice-attempts.
export interface PracticeAttemptDetailResponse {
  attemptId: number;
  learnerId: number;
  learnerName: string;
  lessonId: number;
  lessonTitle: string;
  exerciseId: number;
  exerciseTitle: string;
  pitchScore?: number;
  rhythmScore?: number;
  dynamicsScore?: number;
  totalScore?: number;
  stars?: number;
  pointsEarned?: number;
  isPassed?: boolean;
  syncStatus?: string;
  durationSeconds?: number;
  createdAt: string;
}

// Granularity của Dashboard (ngày/tuần/tháng)
export type DashboardGranularity = 'DAY' | 'WEEK' | 'MONTH';

// Thống kê nhạc cụ phổ biến (Dashboard)
export interface PopularInstrumentStat {
  instrumentId: number;
  instrumentName: string;
  practiceCount: number;
}

// Thống kê thời lượng phiên theo kỳ (Dashboard)
export interface SessionDurationStat {
  period: string;
  averageDurationMinutes: number;
  totalDurationMinutes: number;
}

// Thống kê tỷ lệ duy trì theo kỳ (Dashboard)
export interface RetentionStat {
  period: string;
  retentionRate: number;
}

// Toàn bộ số liệu Dashboard Admin
export interface AdminDashboardStats {
  activeUsers: number;
  popularInstruments: PopularInstrumentStat[];
  sessionDuration: SessionDurationStat[];
  retention: RetentionStat[];
}

// Request tạo giảng viên mới (Admin)
export interface InstructorCreateRequest {
  email: string;
  password: string;
  fullName: string;
  biography?: string;
  yearsExperience?: number;
  instrumentIds?: number[];
}

// Response tạo giảng viên thành công
export interface InstructorCreateResponse {
  id: number;
  userCode?: string;
  email: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  biography?: string;
  yearsExperience?: number;
}

// Phản hồi của giảng viên cho một lượt tập (hỗ trợ cả 2 naming snake_case/camelCase từ API)
export interface FeedbackResponse {
  id: number;
  comment: string;
  instructorName?: string;
  instructor_name?: string;
  createdAt?: string;
  created_at?: string;
}

// Media asset của bài học (dạng snake_case từ GET /api/lessons/{id}/assets)
export interface LessonAsset {
  id: number;
  type: string;
  url: string;
  title?: string;
  tempo_bpm?: number;
  duration_sec?: number;
  mime_type?: string;
}

// Số liệu tổng quan cho Dashboard giảng viên
export interface DashboardStats {
  courses?: number;
  students?: number;
  rating?: number;
  totalLearners?: number;
  activeLessons?: number;
  completionRate?: number;
}
