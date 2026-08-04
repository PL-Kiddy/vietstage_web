import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, User, LogOut } from 'lucide-react';
import { authApi } from '../../api/services';
import { clearAuthSession, getAuthSession } from '../../api/authStorage';
import { notificationApi, profileApi, type Notification, type UserProfile } from '../../api/management';

interface InstructorTopbarProps {
  userName?: string;
  userRole?: string;
}

const InstructorTopbar = ({ userName, userRole }: InstructorTopbarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const session = getAuthSession();
  const displayName = userName ?? userProfile?.fullName ?? session?.name ?? 'Giảng viên';
  const displayRole = userRole ?? userProfile?.role ?? 'Giảng viên';
  const avatarUrl = userProfile?.avatarUrl;

  const unread = notifications.filter((n) => !n.read).length;

  // Fetch profile and notifications
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.get();
        setUserProfile(data);
      } catch {
        // Ignore
      }
    };
    fetchProfile();

    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('vietstage:profile-updated', handleProfileUpdate);

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await notificationApi.list();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();

    return () => {
      window.removeEventListener('vietstage:profile-updated', handleProfileUpdate);
    };
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="flex justify-end items-center h-16 px-6 fixed top-0 right-0 left-64 bg-white/75 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.04)] z-20">
      {/* Right Actions */}
      <div className="flex items-center gap-lg">

        {/* Bell Notification */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative p-2 text-[#5e5e5b] hover:text-[#1D4532] hover:bg-[#EDF7F2] rounded-full transition-colors"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-outline-variant/20 rounded-2xl shadow-xl shadow-black/5 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10 bg-white">
                <span className="font-bold text-[15px] text-[#1D4532] truncate pr-2">
                  Thông báo {unread > 0 && <span className="text-red-500 text-sm">({unread} mới)</span>}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs font-semibold text-[#1D4532] hover:bg-[#EDF7F2] px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto bg-[#fbf9f4]/30">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-on-surface-variant font-medium">
                    <div className="animate-spin w-4 h-4 border-2 border-[#1D4532] border-t-transparent rounded-full mr-2" />
                    Đang tải...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Bell className="w-8 h-8 text-on-surface-variant/30" />
                    <p className="text-sm font-medium text-on-surface-variant">Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`w-full text-left px-4 py-3.5 transition-colors border-b border-outline-variant/10 last:border-0 ${!n.read ? 'bg-[#EDF7F2] hover:bg-[#e4f1ea]' : 'hover:bg-white'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 bg-[#1D4532] rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(29,69,50,0.3)]" />
                        )}
                        <div className={`flex-1 ${!n.read ? '' : 'ml-5'}`}>
                          <div className={`text-sm leading-snug ${!n.read ? 'font-bold text-[#1D4532]' : 'font-medium text-on-surface'}`}>{n.title}</div>
                          <div className="text-[13px] text-on-surface-variant mt-1 line-clamp-2">{n.message}</div>
                          <div className="text-[11px] font-medium text-on-surface-variant/60 mt-2">
                            {new Date(n.createdAt).toLocaleString('vi-VN', { 
                              hour: '2-digit', minute: '2-digit', 
                              day: '2-digit', month: '2-digit', year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-[#d1e4fb]" />

        {/* User Profile */}
        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-sm cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-right">
              <p className="font-label-md text-label-md text-on-surface">
                {displayName}
              </p>
              <p className="text-[10px] text-[#5e5e5b] uppercase tracking-widest">
                {displayRole}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#1D4532]/20 bg-[#EDF7F2] flex items-center justify-center text-[#1D4532] font-bold text-sm overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden' }}
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/instructor/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EDF7F2] text-[14.5px] font-medium text-[#374151] hover:text-[#1D4532] transition-all group"
                >
                  <User className="w-4.5 h-4.5 text-[#9CA3AF] group-hover:text-[#1D4532] transition-colors" />
                  <span>Xem thông tin</span>
                </button>
                <button
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    try {
                      await authApi.logout();
                    } finally {
                      clearAuthSession();
                      navigate('/login');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-[14.5px] font-medium text-red-600 hover:text-red-700 transition-all border-t border-[#E5E7EB] group"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-400 group-hover:text-red-600 transition-colors" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default InstructorTopbar;
