import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, User, LogOut, Settings, Book, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { authApi } from '../../api/services';
import { clearAuthSession, getAuthSession } from '../../api/authStorage';
import { notificationApi, profileApi, type Notification, type UserProfile } from '../../api/management';

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
};

const getNotificationIcon = (type?: string) => {
  switch (type) {
    case 'system': return <Settings className="w-6 h-6 text-gray-500" />;
    case 'course': return <Book className="w-6 h-6 text-[#1D4532]" />;
    case 'alert': return <AlertCircle className="w-6 h-6 text-red-500" />;
    case 'schedule': return <Calendar className="w-6 h-6 text-amber-500" />;
    case 'message': return <MessageSquare className="w-6 h-6 text-blue-500" />;
    default: return <Bell className="w-6 h-6 text-[#1D4532]" />;
  }
};

interface InstructorTopbarProps {
  userName?: string;
  userRole?: string;
}

// Topbar Instructor: thông báo, hồ sơ người dùng, đăng xuất
const InstructorTopbar = ({ userName, userRole }: InstructorTopbarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const session = getAuthSession();
  const displayName = userName ?? userProfile?.fullName ?? session?.name ?? 'Giảng viên';
  const displayRole = userRole ?? userProfile?.role ?? 'Giảng viên';
  const avatarUrl = userProfile?.avatarUrl;

  const unread = notifications.filter((n) => !n.read).length;
  
  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read);
  
  const groupedNotifications = filteredNotifications.reduce((acc, n) => {
    const diffHours = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) acc.new.push(n);
    else acc.earlier.push(n);
    return acc;
  }, { new: [] as Notification[], earlier: [] as Notification[] });

  // Fetch profile and notifications
  // Tải hồ sơ (GET /api/users/me) và thông báo (GET /api/notifications) khi mount
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

  // Đánh dấu 1 thông báo đã đọc (PUT /api/notifications/{id})
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

  // Đánh dấu tất cả đã đọc (PUT /api/notifications)
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
            <div className="absolute right-0 top-full mt-2 w-[400px] bg-white border border-outline-variant/20 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex flex-col px-4 pt-4 pb-2 border-b border-outline-variant/10 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[24px] tracking-tight text-on-surface">Thông báo</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {unread > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[13px] font-semibold text-[#1D4532] hover:bg-[#EDF7F2] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        title="Đánh dấu tất cả đã đọc"
                      >
                        <CheckCheck className="w-4 h-4 inline mr-1" />Đọc tất cả
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="p-2 rounded-full text-on-surface-variant hover:bg-outline-variant/10 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Filter Pills */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilter('all')} 
                    className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold transition-colors ${filter === 'all' ? 'bg-[#EDF7F2] text-[#1D4532]' : 'hover:bg-outline-variant/10 text-on-surface'}`}
                  >
                    Tất cả
                  </button>
                  <button 
                    onClick={() => setFilter('unread')} 
                    className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold transition-colors ${filter === 'unread' ? 'bg-[#EDF7F2] text-[#1D4532]' : 'hover:bg-outline-variant/10 text-on-surface'}`}
                  >
                    Chưa đọc
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[480px] overflow-y-auto bg-white pb-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-on-surface-variant font-medium">
                    <div className="animate-spin w-4 h-4 border-2 border-[#1D4532] border-t-transparent rounded-full mr-2" />
                    Đang tải...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Bell className="w-10 h-10 text-outline-variant/40" />
                    <p className="text-[15px] font-semibold text-on-surface-variant">Không có thông báo nào</p>
                  </div>
                ) : (
                  <>
                    {groupedNotifications.new.length > 0 && (
                      <div className="mt-2">
                        <div className="px-4 py-2">
                          <h4 className="font-bold text-[16px] text-on-surface">Mới</h4>
                        </div>
                        {groupedNotifications.new.slice(0, 15).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#f2f4f7] transition-colors flex items-center gap-3 relative overflow-hidden group"
                          >
                            <div className="relative shrink-0">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-outline-variant/10 ${!n.read ? 'bg-[#EDF7F2]' : 'bg-white shadow-sm'}`}>
                                {getNotificationIcon(n.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="text-[14.5px] leading-snug text-on-surface line-clamp-3">
                                <span className={`mr-1 ${!n.read ? 'font-bold' : 'font-semibold'}`}>{n.title}</span>
                                <span className={`${!n.read ? 'font-medium' : 'text-on-surface-variant'}`}>{n.message}</span>
                              </div>
                              <div className={`text-[13px] mt-1 ${!n.read ? 'font-bold text-[#1D4532]' : 'font-medium text-on-surface-variant'}`}>
                                {getTimeAgo(n.createdAt)}
                              </div>
                            </div>
                            {!n.read && (
                              <div className="shrink-0 flex items-center justify-center w-4">
                                <div className="w-3 h-3 bg-[#1D4532] rounded-full shadow-[0_0_8px_rgba(29,69,50,0.4)]"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {groupedNotifications.earlier.length > 0 && (
                      <div className="mt-2">
                        <div className="px-4 py-2">
                          <h4 className="font-bold text-[16px] text-on-surface">Trước đó</h4>
                        </div>
                        {groupedNotifications.earlier.slice(0, 15).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#f2f4f7] transition-colors flex items-center gap-3 relative overflow-hidden group"
                          >
                            <div className="relative shrink-0">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-outline-variant/10 ${!n.read ? 'bg-[#EDF7F2]' : 'bg-white shadow-sm'}`}>
                                {getNotificationIcon(n.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="text-[14.5px] leading-snug text-on-surface line-clamp-3">
                                <span className={`mr-1 ${!n.read ? 'font-bold' : 'font-semibold'}`}>{n.title}</span>
                                <span className={`${!n.read ? 'font-medium' : 'text-on-surface-variant'}`}>{n.message}</span>
                              </div>
                              <div className={`text-[13px] mt-1 ${!n.read ? 'font-bold text-[#1D4532]' : 'font-medium text-on-surface-variant'}`}>
                                {getTimeAgo(n.createdAt)}
                              </div>
                            </div>
                            {!n.read && (
                              <div className="shrink-0 flex items-center justify-center w-4">
                                <div className="w-3 h-3 bg-[#1D4532] rounded-full shadow-[0_0_8px_rgba(29,69,50,0.4)]"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
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
