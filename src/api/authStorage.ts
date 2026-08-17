import type { AuthResponse, AuthSession, BackendRole, PortalRole } from './types';

const SESSION_KEY = 'vietstage_auth_session';
const LEGACY_USER_KEY = 'vietstage_current_user';

// Chuyển role từ backend (ADMIN/INSTRUCTOR/LEARNER) sang role portal (admin/instructor/learner)
export const toPortalRole = (role?: BackendRole | string): PortalRole => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'INSTRUCTOR':
      return 'instructor';
    default:
      return 'learner';
  }
};

// Đọc session đăng nhập (ưu tiên sessionStorage, fallback localStorage)
export const getAuthSession = (): AuthSession | null => {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
};

// Lưu session sau khi đăng nhập: remember=true -> localStorage, ngược lại sessionStorage
export const saveAuthSession = (
  response: AuthResponse,
  fallbackEmail: string,
  remember: boolean,
): AuthSession => {
  if (!response.token || !response.refreshToken || !response.sessionId || !response.role) {
    throw new Error('Phản hồi đăng nhập thiếu token hoặc thông tin phiên.');
  }

  const session: AuthSession = {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    sessionId: response.sessionId,
    email: response.email ?? fallbackEmail,
    name: response.fullName ?? response.userCode ?? fallbackEmail,
    role: toPortalRole(response.role),
    userCode: response.userCode,
  };

  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  otherStorage.removeItem(SESSION_KEY);
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  sessionStorage.setItem(LEGACY_USER_KEY, JSON.stringify(session));
  return session;
};

// Cập nhật token/refreshToken/sessionId sau khi refresh phiên (giữ nguyên nơi lưu trữ)
export const updateAuthTokens = (
  accessToken: string,
  refreshToken: string,
  sessionId: string,
): AuthSession | null => {
  const current = getAuthSession();
  if (!current) return null;
  const updated = { ...current, accessToken, refreshToken, sessionId };
  const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(updated));
  sessionStorage.setItem(LEGACY_USER_KEY, JSON.stringify(updated));
  return updated;
};

// Xóa toàn bộ session (localStorage + sessionStorage) khi đăng xuất
export const clearAuthSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_USER_KEY);
};
