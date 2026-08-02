import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, CheckCheck, X } from 'lucide-react';
import { authApi } from '../../api/services';
import { clearAuthSession, getAuthSession } from '../../api/authStorage';
import { notificationApi, type Notification } from '../../api/management';

interface AdminTopbarProps {
  userName?: string;
  userRole?: string;
}

const AdminTopbar = ({ userName, userRole }: AdminTopbarProps) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const session = getAuthSession();
  const displayName = userName ?? session?.name ?? 'Quản trị viên';
  const displayRole = userRole ?? 'Administrator';
  const navigate = useNavigate();

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
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-10 flex justify-between items-center h-16 px-6 bg-white border-b border-[#E5E7EB] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Search */}
      <div className="flex items-center gap-2 bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E5E7EB] w-80 focus-within:ring-1 focus-within:ring-[#1D4532]/30 transition-all">
        <Search className="w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Tìm kiếm dữ liệu hệ thống..."
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full placeholder:text-[#9CA3AF] text-[#374151]"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-lg">

        {/* Bell Notification */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative p-2 text-[#5e5e5b] hover:text-primary hover:bg-[#edf4ff] rounded-full transition-colors"
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
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-[#e3efff] flex items-center justify-center text-primary font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/admin/profile');
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

export default AdminTopbar;
