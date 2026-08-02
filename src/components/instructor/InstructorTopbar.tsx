import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, CheckCheck, X } from 'lucide-react';
import { authApi } from '../../api/services';
import { clearAuthSession, getAuthSession } from '../../api/authStorage';
import { notificationApi, type Notification } from '../../api/management';

const InstructorTopbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const session = getAuthSession();
  const initials = (session?.name ?? 'Giảng viên')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(-2)
    .toUpperCase();

  const unread = notifications.filter((n) => !n.read).length;

  // Fetch notifications on mount
  useEffect(() => {
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
    <header className="flex justify-between items-center h-16 px-margin-desktop md:ml-72 w-[calc(100%-18rem)] fixed top-0 bg-surface border-b border-outline-variant/10 shadow-sm z-40">
      {/* Search */}
      <div className="flex items-center gap-lg w-full max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm kiếm bài giảng, học viên..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-secondary text-body-md font-body-md outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-md">

        {/* Bell Notification */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
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
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#d1e4fb] rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1e4fb] bg-[#f7f9ff]">
                <span className="font-semibold text-sm text-on-surface">
                  Thông báo {unread > 0 && <span className="text-red-500">({unread} chưa đọc)</span>}
                </span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[#5e5e5b] hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-[#5e5e5b]">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Đang tải...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell className="w-8 h-8 text-[#d1e4fb]" />
                    <p className="text-sm text-[#5e5e5b]">Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#edf4ff] transition-colors border-b border-[#d1e4fb]/30 last:border-0 ${
                        !n.read ? 'bg-[#f0f7ff]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                        <div className={!n.read ? '' : 'ml-4'}>
                          <div className="font-medium text-sm text-on-surface leading-tight">{n.title}</div>
                          <div className="text-xs text-[#5e5e5b] mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="text-[10px] text-[#5e5e5b]/60 mt-1">
                            {new Date(n.createdAt).toLocaleString('vi-VN')}
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

        <div className="w-px h-6 bg-outline-variant/30 mx-2" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-xs cursor-pointer hover:opacity-85 transition-opacity"
          >
            {initials}
          </div>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/instructor/profile');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#edf4ff] text-[14px] text-on-surface transition-colors"
                >
                  Xem thông tin
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
                  className="w-full text-left px-4 py-2 hover:bg-[#edf4ff] text-[14px] text-red-500 transition-colors border-t border-[#d1e4fb]/40"
                >
                  Đăng xuất
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
