import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { authApi } from '../../api/services';
import { clearAuthSession, getAuthSession } from '../../api/authStorage';

const InstructorTopbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const initials = (getAuthSession()?.name ?? 'Giảng viên')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(-2)
    .toUpperCase();

  return (
    <header className="flex justify-between items-center h-16 px-margin-desktop md:ml-72 w-[calc(100%-18rem)] fixed top-0 bg-surface border-b border-outline-variant/10 shadow-sm z-40">
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
      <div className="flex items-center gap-md">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>
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
                  Profile
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
                  className="w-full text-left px-4 py-2 hover:bg-[#edf4ff] text-[14px] text-error transition-colors border-t border-[#d1e4fb]/40"
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
